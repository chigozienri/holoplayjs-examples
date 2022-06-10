/*
 * This program is licensed under the MIT License.
 * Copyright 2014, aike (@aike1000)
 *
 */
var nFull = 0;
var nPage = 0;
var start = 0;
var dist = 0;
var effect;
var stType = 1;
var swap = true;
var video = null;
var audio = null;
var video2 = null;
var vw;
var vh;
var canvasl = null;
var canvasr = null;
var ctxl = null;
var ctxr = null;
var isVideo = true;
var ChangeCanvas = true;
var isStart = false;
var isiOS = false;
var file3d;
var timeall = 0;
var timecnt = 0;
var camera;
var cameraDir;
var devrot = false;
var deffile = true;
var files;
var holoplay;
var showbtn = true;
var ThView = function(arg) {
    this.d2r = function(d) {
        return d * Math.PI / 180;
    };
    this.id = arg.id; // id of parent element *required*
    if (arg.file instanceof Array) {
        this.file = arg.file; // filename *required*
    } else {
        this.file = [arg.file];
    }
    this.interval = (arg.interval == undefined) ? 500 : arg.interval; // animation rate
    this.width = (arg.width == undefined) ? window.innerWidth : arg.width; // pixel (500)
    this.height = (arg.height == undefined) ? window.innerHeight : arg.height; // pixel (300)
    this.rotation = (arg.rotation == undefined) ? false : arg.rotation; // true/false (false)
    this.speed = (arg.speed == undefined) ? 0.001 * 10 / 10 : 0.001 * arg.speed /
        10; // -100..-1, 1..100 (10)
    this.zoom = (arg.zoom == undefined) ? 70 : arg.zoom; // 20 .. 130 (70)
    this.firstview = (arg.firstview == undefined) ? 0 : this.d2r(-arg.firstview); // 0 .. 360 (0)
    this.degree = (arg.degree == undefined) ? [0, 0, 0] // [0,0,0] .. [360,360,360] ([0,0,0])
        : [this.d2r(arg.degree[0]), this.d2r(arg.degree[1]), this.d2r(arg.degree[
            2])];
    this.pan = this.firstview;
    this.tilt = 0;
    cameraDir = new THREE.Vector3(Math.sin(this.pan), Math.sin(this.tilt),
        Math.cos(this.pan));
    this.oldPosition = {
        x: null,
        y: null
    };
    this.mousedown = false;
    this.moving = false;
    this.imageNo = 0;
    this.element = document.getElementById(this.id);
    this.show();
    button6.innerHTML="Full";
}
ThView.prototype.toggleRotation = function() {
        //	this.rotation = ! this.rotation;
        this.rotation = false;
    }
    ///////// drag callback
ThView.prototype.rotateCamera = function(x, y) {
    if (!this.mousedown) return;
    var pos = {
        x: x,
        y: y
    };
    if (this.oldPosition.x === null) {
        this.oldPosition = pos;
        return;
    }
    this.pan -= (this.oldPosition.x - pos.x) * 0.005;
    this.tilt -= (this.oldPosition.y - pos.y) * 0.004;
    var limit = Math.PI / 2 - 0.3;
    if (this.tilt > limit) this.tilt = limit;
    if (this.tilt < -limit) this.tilt = -limit;
    var limit = Math.PI / 2 - 0.3;
    if (this.pan > limit) this.pan = limit;
    if (this.pan < -limit) this.pan = -limit;
    cameraDir.x = Math.sin(this.pan) * Math.cos(this.tilt);
    cameraDir.z = Math.cos(this.pan) * Math.cos(this.tilt);
    cameraDir.y = Math.sin(this.tilt);
    camera.lookAt(cameraDir);
    if (this.sync) {
        this.sync.camera.lookAt(cameraDir);
    }
    this.oldPosition = pos;
    this.moving = true;
}
ThView.prototype.setCameraDir = function(alpha, beta, gamma) {
    if (this.rotation) {
        this.rotation = false;
    }
    var tilt2;
    var pan2;
    switch (window.orientation) {
        case 0:
            cameraDir.x = Math.sin(alpha + gamma) * Math.cos(-(beta + Math.PI /
                2));
            cameraDir.z = Math.cos(alpha + gamma) * Math.cos(-(beta + Math.PI /
                2));
            cameraDir.y = Math.sin(-(beta + Math.PI / 2));
            break;
        case 90:
            if (gamma < 0) {
                tilt2 = -(Math.PI / 2 + gamma);
                pan2 = alpha - Math.PI;
            } else {
                tilt2 = Math.PI / 2 - gamma;
                pan2 = alpha;
            }
            cameraDir.x = Math.sin(pan2) * Math.cos(tilt2);
            cameraDir.z = Math.cos(pan2) * Math.cos(tilt2);
            cameraDir.y = Math.sin(tilt2);
            break;
        case -90:
            if (gamma < 0) {
                tilt2 = -(Math.PI / 2 + gamma);
                pan2 = alpha - Math.PI;
            } else {
                tilt2 = Math.PI / 2 - gamma;
                pan2 = alpha;
            }
            cameraDir.x = Math.sin(pan2) * Math.cos(-tilt2);
            cameraDir.z = Math.cos(pan2) * Math.cos(-tilt2);
            cameraDir.y = Math.sin(-tilt2);
            break;
        case 180:
            cameraDir.x = Math.sin(alpha + gamma) * Math.cos(-(beta + Math.PI /
                2));
            cameraDir.z = Math.cos(alpha + gamma) * Math.cos(-(beta + Math.PI /
                2));
            cameraDir.y = Math.sin(-(beta + Math.PI / 2));
            break;
    }
    camera.lookAt(cameraDir);
};
///////// wheel callback
ThView.prototype.zoomCamera = function(val) {
        this.zoom += val * 0.1;
        if (this.zoom < 20) this.zoom = 20;
        if (this.zoom > 130) this.zoom = 130;
        camera.fov = this.zoom;
        camera.updateProjectionMatrix();
        if (this.sync) {
            this.sync.camera.fov = this.zoom;
            this.sync.camera.updateProjectionMatrix();
        }
    }
    ///////// main process
ThView.prototype.show = function() {
    var self = this;
    var onPointerDownPointerX0;
    var onPointerDownPointerY0;
    var texturel;
    var texturer;
    var _animationID = null;
    if (navigator.userAgent.indexOf("iPhone") > 0 || navigator.userAgent.indexOf(
        "iPod") > 0 || navigator.userAgent.indexOf("iPad") > 0) {
        isiOS = true;
    }
    var renderer;
    renderer = new THREE.WebGLRenderer({
        antialias: false
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 1);
    this.element.appendChild(renderer.domElement); // append to <DIV>
    document.getElementById('files').addEventListener('change',
        handleFileSelect, false);

    function handleFileSelect(evt) {
            files = evt.target.files; // FileList object
            if (files.length > 0) {
                deffile = false;
                self.imageNo = 0;
                loadfiletotex(self.imageNo);
            }
        }
    var onmouseupOrg = document.onmouseup;
    document.onmouseup = function() {
        if (onmouseupOrg) onmouseupOrg();
        self.mousedown = false;
    };



    document.addEventListener('mousedown', function(e) {
        e.preventDefault();
        self.mousedown = true;
        self.oldPosition = {
            x: e.pageX,
            y: e.pageY
        };
        onPointerDownPointerX0 = e.clientX;
        onPointerDownPointerY0 = e.clientY;
    });
    document.addEventListener('mousemove', function(e) {
        e.preventDefault();
        self.rotateCamera(e.pageX, e.pageY);
    });
    document.addEventListener('mouseup', function(e) {
        e.preventDefault();
        var dx = onPointerDownPointerX0 - e.clientX;
        var dy = onPointerDownPointerY0 - e.clientY;
        var wx = window.innerWidth;
        var wy = window.innerHeight;
        if ((dx * dx + dy * dy) < 50 && e.clientY < (wy - 50)) {
                document.getElementById("btn").style.visibility ="hidden";
                showbtn = false;
        }
    });
    // chrome / safari / IE
    this.element.onmousewheel = function(e) {
        var delta = e.deltaY ? e.deltaY : e.wheelDelta ? -e.wheelDelta :
            -e.wheelDeltaY * 0.2;
        self.zoomCamera(delta);
        e.preventDefault();
    };
    // firefox
    this.element.addEventListener("DOMMouseScroll", function(e) {
        self.zoomCamera(e.detail * 5);
        e.preventDefault();
    });
    this.element.addEventListener("dblclick", function(e) {
        swap = !swap;
    }, false);

document.addEventListener('fullscreenchange', changeFullScreenHandler);
document.addEventListener('mozfullscreenchange', changeFullScreenHandler);
document.addEventListener('webkitfullscreenchange', changeFullScreenHandler);

    function changeFullScreenHandler(event) {
	if ((document.fullScreenElement && document.fullScreenElement !== null) ||(!document.mozFullScreen && !document.webkitIsFullScreen)) {
		nFull=0;
	//	button6.innerHTML="Full";
		}
	else {
		nFull=1;
	//	button6.innerHTML="Close";
		}
    	}

function toggleFullScreen(){

	nFull=(nFull+1)%2;
	if(nFull==1){
		fullscreenon();

	}
      else{

		fullscreenoff();

	}

}

function fullscreenon(){
		nFS=0;
		var docElm = document.getElementById(document.body);
		if (document.body.webkitRequestFullscreen) {
			document.body.webkitRequestFullscreen(); //Chrome15+, Safari5.1+, Opera15+
		} else if (document.body.mozRequestFullScreen) {
			document.body.mozRequestFullScreen(); //FF10+
		} else if (document.body.msRequestFullscreen) {
			document.body.msRequestFullscreen(); //IE11+
		} else if (document.body.requestFullscreen) {
			document.body.requestFullscreen(); // HTML5 Fullscreen API仕様
		} else {
			alert('ご利用のブラウザはフルスクリーン操作に対応していません');
			return;
		}
	}

function fullscreenoff(){
		if (document.webkitCancelFullScreen) {
			document.webkitCancelFullScreen(); //Chrome15+, Safari5.1+, Opera15+
		} else if (document.mozCancelFullScreen) {
			document.mozCancelFullScreen(); //FF10+
		} else if (document.msExitFullscreen) {
			document.msExitFullscreen(); //IE11+
		} else if(document.cancelFullScreen) {
			document.cancelFullScreen(); //Gecko:FullScreenAPI仕様
		} else if(document.exitFullscreen) {
			document.exitFullscreen(); // HTML5 Fullscreen API仕様
		}
	}

function KeyDownFunc(e){
        var Keynum;
        if (window.event) Keynum = e.keyCode; // IE
        else if (e.which) Keynum = e.which;
    //    button6.innerHTML=""+Keynum;
        if (Keynum == 32) { //Next image
            if (deffile) {
                self.imageNo = self.imageNo + 2;
                if (self.imageNo > self.file.length - 1) self.imageNo =
                    0;
            } else {
                self.imageNo = self.imageNo + 1;
                if (self.imageNo > files.length - 1) self.imageNo =
                    0;
            }
            loadfiletotex(self.imageNo);
        } else if (Keynum == 8) { //Previous image
            if (deffile) {
                self.imageNo = self.imageNo - 2;
                if (self.imageNo < 0) self.imageNo = self.file.length -
                    2;
            } else {
                self.imageNo = self.imageNo - 1;
                if (self.imageNo < 0) self.imageNo = files.length -
                    1;
            }
            loadfiletotex(self.imageNo);
        } else if(Keynum==13) {	//Enter : Full screen ON/OFF
	    toggleFullScreen();
	} else {
	holoplay.sendkeycode(Keynum);
	}
    }

window.focus();
if(window.addEventListener){

	// キーボードを押したときに実行されるイベント
	window.addEventListener("keydown" , KeyDownFunc);

// アタッチイベントに対応している
}else if(document.attachEvent){

	// キーボードを押したときに実行されるイベント
	document.attachEvent("onkeydown" , KeyDownFunc);

}


    window.addEventListener('resize', function(e) {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        holoplay.setSize(window.innerWidth, window.innerHeight);
    });
    // iOS
    window.addEventListener("deviceorientation", function(e) {
        if (e.alpha) {
            if (devrot) self.setCameraDir(self.d2r(e.alpha), self.d2r(
                e.beta), self.d2r(e.gamma));
            if (Math.abs(e.gamma) < 10) {
                nPage = 2;
            } else if (Math.abs(e.gamma) > 40 && nPage == 2) {
                nPage = 1;
            }
            if (nPage == 1) {
                nPage = 0;
            } else {}
        }
    });
    window.addEventListener("orientationchange", function(e) {});
    window.onpagehide = function() {
        if (!video.paused) {
            video.pause();
            video.currentTime = 0;
        }
    }
    this.element.addEventListener('dragover', function(event) {
        event.preventDefault();
    }, false);
    this.element.addEventListener('drop', function(event) {
        event.preventDefault();
        files = event.dataTransfer.files; // FileList object
        if (files.length > 0) {
            deffile = false;
            self.imageNo = 0;
            loadfiletotex(self.imageNo);
        }
    }, false);
    button1.onclick = function() { //Previous
        if (deffile) {
            self.imageNo = self.imageNo - 2;
            if (self.imageNo < 0) self.imageNo = self.file.length - 2;
        } else {
            self.imageNo = self.imageNo - 1;
            if (self.imageNo < 0) self.imageNo = files.length - 1;
        }
        loadfiletotex(self.imageNo);
    }
    button2.onclick = function() { //Next
        if (deffile) {
            self.imageNo = self.imageNo + 2;
            if (self.imageNo > self.file.length - 1) self.imageNo = 0;
        } else {
            self.imageNo = self.imageNo + 1;
            if (self.imageNo > files.length - 1) self.imageNo = 0;
        }
        loadfiletotex(self.imageNo);
    }
    button3.onclick = function() { //Swap
        swap = !swap;
    }
    button4.onclick = function() { //PLAY
        if (video.paused) {
            video.play();
            timeall = 0;
            timecnt = 0;
        } else {
            video.pause();
            timeall = 0;
            timecnt = 0;
        }
    }
    button5.onclick = function() { //Devaice rotation
        devrot = !devrot;
    }
    button6.onclick = function() { //Page reload
//        location.reload(false);
	toggleFullScreen();
    }
    button0.onclick = function() { //Stereo
   //     effect.dispose();
   //     effect = null;
        stType++;
        if (stType > 7) stType = 0;
    //    setstereomode();
    }
    var geometry;
    var material;
    var scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(this.zoom, this.width / this.height);
    camera.position = new THREE.Vector3(0, 0, 0);
    camera.lookAt(cameraDir);
    camera.rotation.order = 'ZXY';
    scene.add(camera);
    var light = new THREE.AmbientLight(0xffffff);
    scene.add(light);
    this.texture = new Array(this.file.length * 2);
    var canvas = document.createElement('canvas');
    canvas.height = 1024;
    canvas.width = 1024;
    texturel = new THREE.Texture(canvas);
    texturer = new THREE.Texture(canvas);
    loadfiletotex(0);
    holoplay = new HoloPlay(scene, camera, renderer);
    holoplay.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("btn").style.visibility ="hidden";

    function loadfiletotex(ncnt) {
        if (!deffile) {
            loadfiletotex2(ncnt);
            return;
        }
        if (isStart) {
            cancelAnimationFrame(_animationID);
            texturel.dispose();
            texturel = null;
            texturer.dispose();
            texturer = null;
            if (video) {
                video.pause();
                video.currentTime = 0;
                video = null;
            }
        }
        if (self.file[ncnt] == 'm') {
            ChangeCanvas = true;
            video = document.createElement('video');
            video.src = self.file[ncnt + 1];
            window.makeVideoPlayableInline(video);
            video.play();
            isVideo = true;
            timeall = 0;
            timecnt = 0;
            if (isStart) render();
            else isStart = true;
        } else if (self.file[ncnt] == 'p') {
            var img;
            img = document.createElement('img');
            var imgload = false;
            img.onload = (function(e) {
                if (canvasl == null) canvasl = document.createElement(
                    'canvas');
                canvasl.height = img.height;
                canvasl.width = img.width/2;
                var ctxl = canvasl.getContext('2d');
                ctxl.drawImage(img, 0, 0, img.width/2, img.height, 0, 0, img.width/2, img.height);
                texturel = new THREE.Texture(canvasl);
	//	texturel.wrapS = THREE.RepeatWrapping;
	//	texturel.repeat.x = - 1;
                texturel.flipY = false;
                texturel.needsUpdate = true;
                if (canvasr == null) canvasr = document.createElement(
                    'canvas');
                canvasr.height = img.height;
                canvasr.width = img.width/2;
                var ctxr = canvasr.getContext('2d');
                ctxr.drawImage(img, img.width/2, 0, img.width/2,
                    img.height, 0, 0, img.width/2, img.height);
                texturer = new THREE.Texture(canvasr);
	//	texturer.wrapS = THREE.RepeatWrapping;
	//	texturer.repeat.x = - 1;
                texturer.flipY = false;
                texturer.needsUpdate = true;
                isVideo = false;
                isStart = true;
                render();
            });
            img.src = self.file[ncnt + 1];
        }
    }

    function loadfiletotex2(ncnt) {
            cancelAnimationFrame(_animationID);
            texturel.dispose();
            texturel = null;
            texturer.dispose();
            texturer = null;
            if (video) {
                video.pause();
                video.currentTime = 0;
                video = null;
            }
            var file = files[ncnt];
            var createObjectURL = window.URL && window.URL.createObjectURL ?
                function(file) {
                    return window.URL.createObjectURL(file);
                } : window.webkitURL && window.webkitURL.createObjectURL ?
                function(file) {
                    return window.webkitURL.createObjectURL(file);
                } : undefined;
            if (file.type.substring(0, 5) === 'video') {
                ChangeCanvas = true;
                video = document.createElement('video');
		 video.addEventListener('ended', function(){
		        video.play();
		    }, true);
                video.src = createObjectURL(file);
                window.makeVideoPlayableInline(video);
                video.play();
                isVideo = true;
                render();
            } else {
                var img;
                img = document.createElement('img');
                var imgload = false;
                img.onload = (function(e) {
                    if (canvasl == null) canvasl = document.createElement(
                        'canvas');
                    canvasl.height = img.height;
                    canvasl.width = img.width/2;
                    var ctxl = canvasl.getContext('2d');
                    ctxl.drawImage(img, 0, 0, img.width/2, img.height, 0, 0, img.width/2, img.height);
                    texturel = new THREE.Texture(canvasl);
	//	texturel.wrapS = THREE.RepeatWrapping;
	//	texturel.repeat.x = - 1;
                    texturel.flipY = false;
                    texturel.needsUpdate = true;
                    if (canvasr == null) canvasr = document.createElement(
                        'canvas');
                    canvasr.height = img.height;
                    canvasr.width = img.width/2;
                    var ctxr = canvasr.getContext('2d');
                    ctxr.drawImage(img, img.width/2, 0, img.width/2,
                        img.height, 0, 0, img.width/2, img.height);
                    texturer = new THREE.Texture(canvasr);
	//	texturer.wrapS = THREE.RepeatWrapping;
	//	texturer.repeat.x = - 1;
                    texturer.flipY = false;
                    texturer.needsUpdate = true;
                    isVideo = false;
                    render();
                });
                img.src = createObjectURL(file);
            }
        }

    geometry = new THREE.SphereBufferGeometry(100, 128, 64);
    geometry.scale(1, 1, 1);
    var uvs = geometry.attributes.uv.array;
    for (var i = 0; i < uvs.length; i+=2) {
      uvs[i] *= 2;
      uvs[i] -= .5;
    }

    material = new THREE.MeshPhongMaterial({
        side: THREE.DoubleSide,
        color: 0xffffff,
        specular: 0xcccccc,
        shininess: 50,
        ambient: 0xffffff,
        map: texturel
    });
    ///////// MESH
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.y = Math.PI/2;
    this.mesh.rotation.x += Math.PI;
    this.mesh.rotation.x += this.degree[0];
    this.mesh.rotation.y += this.degree[1];
    this.mesh.rotation.z += this.degree[2];
    scene.add(this.mesh);

    function setstereomode() {
        var width = window.innerWidth;
        var height = window.innerHeight;
        if (stType==2 || stType==3 || stType==4) effect = new THREE.AnaglyphEffect(renderer,
            stType - 2);
        else if (stType < 2 || stType==7) effect = new THREE.StereoEffect(renderer,
            stType);
        else if (stType == 6)  effect = new THREE.ParallaxBarrierEffect2(renderer);
	else effect = new THREE.ParallaxBarrierEffect(renderer);
        effect.setSize(width, height);
        if (stType == 1) camera.aspect = window.innerWidth / (window.innerHeight *
            2);
        else camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    };
 //   setstereomode();

    function makeframe2() {
        if (ChangeCanvas) {
            texturel = new THREE.VideoTexture(video);
            texturel.minFilter = THREE.LinearFilter;
            texturel.magFilter = THREE.LinearFilter;
            texturel.format = THREE.RGBFormat;
            ChangeCanvas = false;
        }
    }

    function makeframe() {
            if (video.paused) return;
            vw = video.videoWidth;
            vh = video.videoHeight;
            if (vw > 0 && vh > 0 && ChangeCanvas) {
                ChangeCanvas = false;
                if (canvasl == null) canvasl = document.createElement(
                    'canvas');
                canvasl.height = vh;
                canvasl.width = vw/2;
                ctxl = canvasl.getContext('2d');
                texturel = new THREE.Texture(canvasl);
                texturel.flipY = false;
                if (canvasr == null) canvasr = document.createElement(
                    'canvas');
                canvasr.height = vh;
                canvasr.width = vw/2;
                ctxr = canvasr.getContext('2d');
                texturer = new THREE.Texture(canvasr);
                texturer.flipY = false;
            }
            ctxl.drawImage(video, 0, 0, vw/2, vh, 0, 0, vw/2, vh);
            if (texturel != null) texturel.needsUpdate = true;
            ctxr.drawImage(video, vw/2, 0, vw/2, vh, 0, 0, vw/2, vh);
            if (texturer != null) texturer.needsUpdate = true;
        }

    function render() {
        if (holoplay != null && isStart) {
            var time1;
            var time2;
            var startT = new Date();
            time1 = startT.getTime();
            _animationID = requestAnimationFrame(render);
            if ((self.rotation)) {
                self.mesh.rotation.y += self.speed;
                if (self.sync) {
                    self.sync.mesh.rotation.y += self.speed;
                }
            }
            if (isVideo && isStart) makeframe();
            material.map = texturel;
            holoplay.render0(scene, camera);
            material.map = texturer;
            holoplay.render(scene, camera);
            var endT = new Date();
            time2 = endT.getTime();
            var dtime = time2 - time1;
            timecnt++;
            timeall = timeall + dtime;
            dtime = timeall / timecnt;
            dtime = (parseInt(dtime * 100)) / 100;
            var stname = " ";
            var swpname = " ";
            if (stType == 0) stname = "2D ";
            else if (stType == 1) stname = "SBS ";
            else if (stType == 2) stname = "Dubois ";
            else if (stType == 3) stname = "Color ";
            else if (stType == 4) stname = "Glay ";
            else if (stType == 5) stname = "H_Int ";
            else if (stType == 6) stname = "3DLCD ";
            else if (stType == 7) stname = "HSBS ";
            if (swap) swpname = "L/R ";
            else swpname = "R/L ";
            button0.innerHTML = "" + stname;
            button3.innerHTML = " " + swpname;
            if (devrot) button5.innerHTML = " Dev ";
            else button5.innerHTML = " Tch ";
            if (isVideo) {
                if (video.paused) button4.innerHTML = " Play ";
                else button4.innerHTML = " Pause";
            } else button4.innerHTML = " Still";
        }
    };
    render();
}
