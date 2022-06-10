//Copyright 2019 Looking Glass Factory Inc.
//All rights reserved.
//Unauthorized copying or distribution of this file, and the source code contained herein, is strictly prohibited.

function HoloPlay(scene, camera, renderer, tex, focalPointVector, constantCenter, hiResRender){
    var verno = 'Ver 0.3';
    var scope = this;
    //This makes sure we don't try to render before initializing
    var initialized = false;
    
    var interval;
    var lastScreenX;
    var lastScreenY;
    var outOfWindow = false;
    
    //private variables
    var _renderer, _scene, _camera, _tex;
    var threeD;
    var jsonObj;
    
    var nFull=0;
    //Stores the distance to the focal plane
    //Let's us change the rotation or position of the camera and still have it work
    //Change this in order to change the focus of the camera after runtime
    var holdCenter, cameraForward, viewScale, center;
    
    //Quilt properties
    var tilesX, tilesY, numViews;
    
    //Camera properties
    var viewCone, startNear, startFar, startDist;
    
    //Render scenes
    var bufferMat, finalRenderScene, finalRenderCamera;

    //Looking Glass buttons
    var buttons, buttonsLastFrame, buttonsAvailable;
    var buttonNames = [ "square", "left", "right", "circle" ];
    
    //A public bool to indicate if you want to use buttons - set to "false" if not to save processing time
    this.useButtons = true;

    var _tileEstimationMat;
    var _offScreenRenderTarget;
    var _renderPlane;
    var _tileEstimationRenderPlane;
    var OffScreenX = 256;
    var OffScreenY = 160;

    var tilePatterns = [[4, 8], [4, 6], [5, 9], [6, 10]];    // tilesX,tileY の取りえる値
    var tilePatternIndex = 0;              // 先頭がデフォルト
    var _lastTileFeature = Number.MAX_VALUE;
    var isEstimating = false;
    var nCntdpt;
    var twod;


    var defaultCalibration = {"configVersion":"1.0","serial":"00112","pitch":{"value":49.96086120605469},"slope":{"value":5.502500057220459},"center":{"value":0.14347827434539795},"viewCone":{"value":40.0},"invView":{"value":1.0},"verticalAngle":{"value":0.0},"DPI":{"value":355.0},"screenW":{"value":2560.0},"screenH":{"value":1600.0},"flipImageX":{"value":0.0},"flipImageY":{"value":0.0},"flipSubp":{"value":0.0}};
    
    function init()
    {
		doLoadEEPROM(true);
        threeD = true;
        jsonObj = null;
	nCntdpt=0;
	twod=0;

        if(hiResRender === undefined){
            hiResRender = true;
        }

        if(focalPointVector === undefined){
            var vector = new THREE.Vector3();
            camera.getWorldDirection(vector); //Sets the vector to the camera forward

            viewScale = Math.max(camera.position.length(), 1); //Sets the focal distance to either the distance to center or just ahead of the camera
            //Because no center was provided in the constructor, it assumes that the center is 0,0,0
            center = new THREE.Vector3(0,0,0);

            vector.multiplyScalar(viewScale);
            focalPointVector = [camera.position.x + vector.x, camera.position.y + vector.y, camera.position.z + vector.z]; //Sets the focal point to the front of the camera as far away as it is from (0,0,0)

        } else{
            if(focalPointVector instanceof THREE.Vector3){
                focalPointVector = [focalPointVector.x, focalPointVector.y, focalPointVector.z];
            }
            center = new THREE.Vector3(focalPointVector[0], focalPointVector[1], focalPointVector[2]);
            viewScale = Math.max(center.distanceTo(camera.position), 1) //Sets the focal distance to either the distance to center or just ahead of the camera
        }
        if(constantCenter === undefined)
            constantCenter = true;

        _renderer = renderer;
        _camera = camera;
        _scene = scene;
	    _tex = tex;

        //Locks the center to a fixed position if true, which is the default
        //Good for orbit controls, but should be false for things like first-person controls
        holdCenter = constantCenter;

        cameraForward = new THREE.Vector3();
        camera.getWorldDirection(cameraForward);

        //Buffer scene
        var renderResolution = 2048;
        tilesX = 4;
        tilesY = 8;
        if(hiResRender){
            renderResolution = 4096;
            tilesX = 5;
            tilesY = 9;
        }
        var renderResolution = 2048;
        tilesX = 4;
        tilesY = 8;
       
        bufferSceneRender = new THREE.WebGLRenderTarget(renderResolution, renderResolution, {format: THREE.RGBFormat});

         //Capture settings
        numViews = tilesX * tilesY;
        viewCone = 40;

        startNear = camera.near;
        startFar = camera.far;
        startDist = viewScale;
        
        //render texture dimensions
        var renderSizeX = renderResolution / tilesX;
        var renderSizeY = renderResolution / tilesY;

        //arraycamera
        var cameras = [];

        for ( var y = 0; y < tilesY; y ++ ) {
          for ( var x = 0; x < tilesX; x ++ ) {
            var subcamera = new THREE.PerspectiveCamera();
            subcamera.viewport = new THREE.Vector4( x * renderSizeX, y * renderSizeY, renderSizeX, renderSizeY );
            cameras.push(subcamera);
          }
        }

        arraycamera = new THREE.ArrayCamera(cameras);

        //Init shader uniforms
        var uniforms =
        {
            quiltTexture: {value: _tex},
            pitch: {value:0},
            tilt: {value:0},
            center: {value:0},
            invView: {value:0},
            flipX: {value:0},
            flipY: {value:0},
            subp: {value:0},
            ri: {value:0},
            bi: {value:2},
            numViews: {value:0},
            tilesX: {value:0},
            tilesY: {value:0},
            windowInnerW: {value:0},
            windowInnerH: {value:0},
            windowOuterW: {value:0},
            windowOuterH: {value:0},
            windowInnerX: {value:0},
            windowInnerY: {value:0},
            windowOuterX: {value:0},
            windowOuterY: {value:0},
            screenW: {value:0},
            screenH: {value:0},
            nCntdpt: {value:0},
            twod: {value:0}
        };

        var tileEstimationUniforms =
        {
            quiltTexture: {value: _tex},
            numViews: {value:0},
            tilesX: {value:0},
            tilesY: {value:0},
            windowInnerW: {value:0},
            windowInnerH: {value:0},
            windowOuterW: {value:0},
            windowOuterH: {value:0},
            windowInnerX: {value:0},
            windowInnerY: {value:0},
            windowOuterX: {value:0},
            windowOuterY: {value:0},
            screenW: {value:0},
            screenH: {value:0},
            paddingRateX: {value:0},
            paddingRateX: {value:0}
        };

        //Set up the shader
        var shaderProperties = {
            uniforms: uniforms,
            vertexShader: VertexShaderCode,
            fragmentShader: FragmentShaderCode
        };

        //Set up the shader
        var tileEstimationShaderProperties = {
            uniforms: tileEstimationUniforms,
            vertexShader: VertexShaderCode,
            fragmentShader: TileEstimationFragmentShaderCode
        };

        //Apply the shader to the buffer material
        bufferMat = new THREE.ShaderMaterial(shaderProperties);
        _tileEstimationMat = new THREE.ShaderMaterial(tileEstimationShaderProperties);

        //Set up the final render scene
        finalRenderScene = new THREE.Scene();
        var renderPlaneGeometry = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight);

        // Quilt描画先平面
        _renderPlane = new THREE.Mesh(renderPlaneGeometry, bufferMat);
        finalRenderScene.add(_renderPlane);

        // タイル数推定用描画先平面
        _tileEstimationRenderPlane = new THREE.Mesh(renderPlaneGeometry, _tileEstimationMat);
        _tileEstimationMat.visible = false;
        finalRenderScene.add(_tileEstimationRenderPlane);

        finalRenderCamera = new THREE.OrthographicCamera(-window.innerWidth/2, window.innerWidth/2, window.innerHeight/2, -window.innerHeight/2, 1, 3);
        finalRenderCamera.position.z = 2;
        finalRenderScene.add(finalRenderCamera);

        // タイル数推定時のレンダーターゲット　128x80px
        _offScreenRenderTarget = new THREE.WebGLRenderTarget(
            OffScreenX,
            OffScreenY,
            {
                magFilter: THREE.LinearFilter,
                minFilter: THREE.LinearFilter
            }
        );

        _renderer.setClearColor(0x000000, 1);

	buttonsLastFrame = [ false, false, false, false ];
        //Add the user buttons
        setupFullScreen();
		
    };

    //******HTML SETUP******//

    //Create the dom element for the fullscreen button
    function makeFullScreenButton(){
        var newHTML =
            '<input type="button" style="margin:20px; position:fixed; top:0px; right:0px; z-index: 10000; height:50px; width:200px;" id="fullscreenButton" value="Full Screen Mode (' + verno + ')"/>';

        var buttonDiv = document.createElement("div");

        buttonDiv.innerHTML = newHTML;

        buttonDiv.setAttribute("id", "fullscreen");

        document.body.appendChild(buttonDiv);
    };

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
		nFull=1;
		videostart();
		document.getElementById('fullscreen').style.visibility ="hidden";
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
		nFull=0;
		document.getElementById('fullscreen').style.visibility = "visible";
	}

	document.addEventListener('fullscreenchange', exitHandler);
	document.addEventListener('webkitfullscreenchange', exitHandler);
	document.addEventListener('mozfullscreenchange', exitHandler);
	document.addEventListener('MSFullscreenChange', exitHandler);

	function exitHandler() {
	    if (!document.fullscreenElement && !document.webkitIsFullScreen && !document.mozFullScreen && !document.msFullscreenElement) {		document.getElementById('fullscreen').style.visibility = "visible";
	      nFull=0;
	    }
	}

    //Adding the functionality for the fullscreen button
    function setupFullScreen(){
        makeFullScreenButton();

        document.getElementById('fullscreen').addEventListener("click", function(){
            toggleFullScreen();
        });
    };

	this.changetex = function(tex) {
//		console.log('changetex');
		bufferMat.uniforms.quiltTexture.value=tex;
		bufferMat.needsUpdate = true;

		_tileEstimationMat.uniforms.quiltTexture.value=tex;
        _tileEstimationMat.needsUpdate = true;
    };

	this.setquiltxy = function(quiltx,quilty) {
//		console.log('setquiltxy');
		tilesX=quiltx;
		tilesY=quilty;
		bufferMat.uniforms.tilesX.value=quiltx;
		bufferMat.uniforms.tilesY.value=quilty;
        bufferMat.needsUpdate = true;
        
        //console.log("Tile: " + tilesX + "," + tilesY);

        // _tileEstimationMat.uniforms.tilesX.value= tilesX;
		// _tileEstimationMat.uniforms.tilesY.value = tilesY;
		// _tileEstimationMat.uniforms.numViews.value = tilesX * tilesY;
		// _tileEstimationMat.needsUpdate = true;

    };

    // タイル数推定開始
    this.startTileEstimation = function() {
        tilePatternIndex = 0;
        _lastTileFeature = Number.MAX_VALUE;

        bufferMat.visible = false;
        _tileEstimationMat.visible = true;
        
        renderer.setRenderTarget(_offScreenRenderTarget);

        isEstimating = true;
    }

    // タイル数推定停止
    this.endTileEstimation = function() {
        if (isEstimating) {
            bufferMat.visible = true;
            _tileEstimationMat.visible = false;

            renderer.setRenderTarget(null);
        }
        isEstimating = false;
    }

    // 各フレームでタイル数推定
    this.updateTileEstimation = function() {
        if (!isEstimating) return;

        if (tilePatternIndex < tilePatterns.length) {
            var tx = tilePatterns[tilePatternIndex][0];    
            var ty = tilePatterns[tilePatternIndex][1];
            var f = this.calculateFeature(tx, ty);

            tilePatternIndex++;

            if (f == 0) {
                this.setquiltxy(tx, ty);
                tilePatternIndex = tilePatterns.length; // 推定終了
            } else if (f < _lastTileFeature) {
                this.setquiltxy(tx, ty);
                _lastTileFeature = f;
            }
        } else {
            this.endTileEstimation();
        }
    };

    // 指定タイル数と仮定したときの現在画像の特徴量（0が最適）を求める
    this.calculateFeature = function(tx, ty) {
        _tileEstimationMat.uniforms.tilesX.value= tx;
		_tileEstimationMat.uniforms.tilesY.value = ty;
		_tileEstimationMat.uniforms.numViews.value = tx * ty;
		_tileEstimationMat.needsUpdate = true;

        var w = _offScreenRenderTarget.width;
        var h = _offScreenRenderTarget.height;
        var buf = new Uint8Array(w * h * 4);

        // bufferMat.visible = false;
        // _tileEstimationMat.visible = true;
        // renderer.setRenderTarget(_offScreenRenderTarget);
        //renderer.clear();
        //renderer.render(scene, camera);
        renderer.render(finalRenderScene, finalRenderCamera);

        // bufferMat.visible = true;
        // _tileEstimationMat.visible = false;
        
        // var context = renderer.getContext();
        // context.readPixels(
        //     0, 0,
        //     w, h,
        //     WebGLRenderingContext.RGBA,
        //     WebGLRenderingContext.UNSIGNED_BYTE,
        //     buf
        //     );
        
        renderer.readRenderTargetPixels(
            _offScreenRenderTarget, 0, 0, w, h, buf
            );

        // renderer.setRenderTarget(null);

        var sum = 0.0;
        var index = 0;
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                for (var i = 0; i < 3; i++) {
                    sum += buf[index];
                    index++;
                }
                index++;    // Skip alpha
            }
        }

        //console.log(sum + " / " + index);
        return sum / index;
    };
	
    //******CALIBRATION SETUP******//
    
	function applyCalibration (calibration_obj)
	{
        if(calibration_obj === undefined || calibration_obj === ""){
            jsonObj = defaultCalibration;
	    twod=1.0;
            bufferMat.uniforms.twod.value = twod;
            bufferMat.needsUpdate = true;
            alert("No Looking Glass display connected; show 2D image")
        } else {
		try {
		 
		    jsonObj = JSON.parse(calibration_obj);
		 
		} catch( e ) {
		 
		    jsonObj = defaultCalibration;
		    twod=1.0;
	            bufferMat.uniforms.twod.value = twod;
	            bufferMat.needsUpdate = true;
            	alert("No Looking Glass display connected; show 2D image")
		}

        }
		setShaderValues(jsonObj.DPI.value, jsonObj.pitch.value, jsonObj.slope.value, jsonObj.screenH.value, jsonObj.screenW.value, jsonObj.center.value, jsonObj.flipImageX.value, jsonObj.flipImageY.value);
		viewCone = jsonObj.viewCone.value;
	}
	
	function saveCalibration (calibration_obj)
	{
		console.log("Calibration in local storage overwritten.");
		localStorage['Config'] = calibration_obj;
    }
	
	function doLoadEEPROM (inInit)
	{
        var OSName="Unknown OS";
        if (navigator.appVersion.indexOf("Win")!=-1) OSName="Windows";
        if (navigator.appVersion.indexOf("Mac")!=-1) OSName="MacOS";
        if (navigator.appVersion.indexOf("X11")!=-1) OSName="UNIX";
        if (navigator.appVersion.indexOf("Linux")!=-1) OSName="Linux";
        
		var ws = new WebSocket('ws://localhost:11222/');
		var finished = function () {
			ws.close();
		};
		var timeout = setTimeout(function () { 
			var errstr = "Calibration not found in internal memory.";
            if (inInit) {
				console.log(errstr); 
			} else { 
				alert(errstr);
			}
			finished();
		}, 800);
		ws.onmessage = function(event) {
			console.log("New calibration loaded from internal memory.");
			saveCalibration(event.data);
			applyCalibration(event.data);
			clearTimeout(timeout);
            initialized = true;
			finished();
		};
		ws.onerror = function(event) {
			if (confirm("Three.js driver not detected! Click OK to download. If you have already installed the driver, please make sure port 11222 is open.")){
                if(OSName == "Windows"){
				    window.location.href = "http://look.glass/threejsdriver_win";
                } else if(OSName == "MacOS"){
                    window.location.href = "http://look.glass/threejsdriver_mac"
                } else{
                    alert("Only Windows and OSX operating systems are currently supported for the Three.js library.")
                }
			}
			finished();
		};
	}

    //*******SHADER SETUP******//

    function setShaderValues(dpi, pitch, slope, screenH, screenW, center, flipX, flipY, invView)
    {
        //        var screenInches = screenW / dpi;
        var screenInches = window.innerWidth / dpi;
        var newPitch = pitch * screenInches;

        //account for tilt in measuring pitch horizontally
        newPitch *= Math.cos(Math.atan(1.0 / slope));
        bufferMat.uniforms.pitch.value = newPitch;

        //tilt
//        var newTilt = screenH / (screenW * slope);
        var newTilt = window.innerHeight / (window.innerWidth * slope);
        if(flipX == 1)
            newTilt *= -1;
        bufferMat.uniforms.tilt.value = newTilt;

        //center
        //I need the relationship between the amount of pixels I have moved over to the amount of lenticulars I have jumped
        //ie how many pixels are there to a lenticular?
        bufferMat.uniforms.center.value = center;
        
        var boundingRect = document.body.getBoundingClientRect();
        var xOffsetInner = document.body.getBoundingClientRect().left;
        var yOffsetInner = document.body.getBoundingClientRect().top;
        
        //screen and window values to offset the image
        bufferMat.uniforms.screenW.value = screenW;
        bufferMat.uniforms.screenH.value = screenH;
        bufferMat.uniforms.windowInnerW.value = boundingRect.width;
        bufferMat.uniforms.windowInnerH.value = boundingRect.height;
        bufferMat.uniforms.windowOuterW.value = window.outerWidth;
        bufferMat.uniforms.windowOuterH.value = window.outerHeight;
        bufferMat.uniforms.windowInnerX.value = window.screenX + boundingRect.left;
        bufferMat.uniforms.windowInnerY.value = window.screenY + boundingRect.top + (window.outerHeight - window.innerHeight);
        bufferMat.uniforms.windowOuterX.value = window.screenX;
        bufferMat.uniforms.windowOuterY.value = window.screenY;
        
//        console.log("windowInnerX: " + bufferMat.uniforms.windowInnerX.value);
//        console.log("windowInnerW: " + bufferMat.uniforms.windowInnerW.value);
//        
//        console.log("windowOuterX: " + bufferMat.uniforms.windowOuterX.value);
//        console.log("windowOuterW: " + bufferMat.uniforms.windowOuterW.value);
//        
//        console.log(screenW);
//        
//        console.log("windowInnerY: " + bufferMat.uniforms.windowInnerY.value);
//        console.log("windowInnerH: " + bufferMat.uniforms.windowInnerH.value);
//        
//        console.log("windowOuterY: " + bufferMat.uniforms.windowOuterY.value);
//        console.log("windowOuterH: " + bufferMat.uniforms.windowOuterH.value);
//        
//        console.log(screenH);
        
        //should we invert?
        bufferMat.uniforms.invView.value = invView;

        //Should we flip it for peppers?
        bufferMat.uniforms.flipX.value = flipX;
        bufferMat.uniforms.flipY.value = flipY;

        bufferMat.uniforms.subp.value = 1/(screenW * 3);

        //tiles
        bufferMat.uniforms.tilesX.value = tilesX;
        bufferMat.uniforms.tilesY.value = tilesY;
	bufferMat.uniforms.nCntdpt.value = nCntdpt;
	bufferMat.uniforms.twod.value = twod;

        bufferMat.needsUpdate = true;


        // タイル数推定用
        _tileEstimationMat.uniforms.tilesX.value = tilesX;
        _tileEstimationMat.uniforms.tilesY.value = tilesY;
        _tileEstimationMat.uniforms.numViews.value = tilesX * tilesY;
        //tileEstimationMat.uniforms.paddingRateX.value = 0;
        //tileEstimationMat.uniforms.paddingRateY.value = 0;
        _tileEstimationMat.needsUpdate = true;
    };

    //*******LOGIC FOR CAPTURING MULTIPLE VIEWS******//
    
    HoloPlay.prototype.lookAt = function(target, camera){
        if(target instanceof THREE.Vector3){
            center = target;
            console.log(_camera);
            if(camera === undefined){
                camera = _camera;
            }
            camera.lookAt(target);
            
        } else if(target instanceof THREE.Object3D){
            center = target.position;
            if(camera === undefined){
                camera = _camera;
            }
            camera.lookAt(target);
        } else{
            console.logWarning("Target must be a THREE.Vector3.");
        }
    }

    HoloPlay.valuerest = function(ncnt){
	    if(ncnt==0) nCntdpt=0;
	    else nCntdpt=nCntdpt+ncnt;
            bufferMat.uniforms.nCntdpt.value = nCntdpt;
            bufferMat.needsUpdate = true;
	    fclr = true;
	};
        
    //Render loop, with options for 3D or 2D rendering
    HoloPlay.prototype.render = function (scene, camera, renderer){
        if(!initialized)
            return;

        if(buttonsAvailable && scope.useButtons){
            var gp = navigator.getGamepads();
            for (var i = 0; i < gp.length; i++) {
              if(gp[i] != null && gp[i].id.indexOf("HoloPlay") > -1){
                buttons = gp[i].buttons;
                break;
              }
            }
            
            for(var i = 0; i < buttons.length; i++){
                if(buttonsLastFrame === undefined && !buttons[i].pressed){
                    continue;
                }
                
                if(buttonsLastFrame === undefined && buttons[i].pressed){
                    buttonDown.index = i;
                    buttonDown.name = buttonNames[i];
                    document.dispatchEvent(buttonDown);
                } else if(!buttonsLastFrame[i] && buttons[i].pressed){
                    buttonDown.index = i;
                    buttonDown.name = buttonNames[i];
                    document.dispatchEvent(buttonDown);
                } else if(buttonsLastFrame[i] && buttons[i].pressed){
                    buttonPressed.index = i;
                    buttonPressed.name = buttonNames[i];
                    document.dispatchEvent(buttonPressed);
                } else if(buttonsLastFrame[i] && !buttons[i].pressed){
                    buttonUp.index = i;
                    buttonUp.name = buttonNames[i];
                    document.dispatchEvent(buttonUp);
                }
            
                buttonsLastFrame[i] = buttons[i].pressed;
            }
            
        }

        if(scene === undefined)
            scene = _scene;
        if(camera === undefined)
            camera = _camera;
        if(renderer === undefined)
            renderer = _renderer;
                
        if(!threeD){
            if(camera.projectionMatrix.elements[8] != 0)
                camera.projectionMatrix.elements[8] = 0;
            renderer.render(scene, camera);
        } else{
            if(jsonObj == null){
                alert("No calibration found! Please ensure that your Looking Glass is plugged in.");
                return;
            }
            
            if(outOfWindow){
                if(lastScreenX != window.screenX || lastScreenY != window.screenY){
                    setShaderValues(jsonObj.DPI.value, jsonObj.pitch.value, jsonObj.slope.value, jsonObj.screenH.value, jsonObj.screenW.value, jsonObj.center.value, jsonObj.flipImageX.value, jsonObj.flipImageY.value, jsonObj.invView.value);
                }
                lastScreenX = window.screenX;
                lastScreenY = window.screenY;
            }
            
            if (isEstimating) {
                this.updateTileEstimation();
            } else {
                renderer.render(finalRenderScene, finalRenderCamera);
            }
        }
    };

    //*****EVENT LISTENERS*****//
    
    function addEvent(obj, evt, fn) {
        if (obj.addEventListener) {
            obj.addEventListener(evt, fn, false);
        }
        else if (obj.attachEvent) {
            obj.attachEvent("on" + evt, fn);
        }
    };
    

    //Custom Looking Glass button events
    var buttonDown = new CustomEvent("buttonDown", {bubbles: true, cancelable: false, name: "none", index: -1});
    var buttonPressed = new CustomEvent("buttonPressed", {bubbles: true, cancelable: false, name: "none", index: -1});
    var buttonUp = new CustomEvent("buttonUp", {bubbles: true, cancelable: false, name: "none", index: -1});
    
    addEvent(window, "gamepadconnected", function(e) {
      var gp = navigator.getGamepads()[e.gamepad.index];
      console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
        gp.index, gp.id,
        gp.buttons.length, gp.axes.length);
      if(gp.id.indexOf("HoloPlay") > -1){
          buttonsAvailable = true;
      }
    });

    addEvent(document, "mouseout", function(e) {
        e = e ? e : window.event;
        var from = e.relatedTarget || e.toElement;
        if (!from || from.nodeName == "HTML") {
            if(!outOfWindow){
                outOfWindow = true;
            }
        }
    });
    
    addEvent(document, "mouseover", function(e){
       e = e ? e : window.event;
       var from = e.relatedTarget || e.toElement;
       if(from != "HTML"){
           if(outOfWindow){
               outOfWindow = false;
           }   
        }
    });
    
    //Reset shader values on window resize to make it draw properly
    addEvent(window, "resize", function(e){
        e = e ? e : window.event;
        setShaderValues(jsonObj.DPI.value, jsonObj.pitch.value, jsonObj.slope.value, jsonObj.screenH.value, jsonObj.screenW.value, jsonObj.center.value, jsonObj.flipImageX.value, jsonObj.flipImageY.value, jsonObj.invView.value);
    });
    
    //Forward Slash for switching between 2D and 3D
    addEvent(document, "keydown", function (e) {
        e = e ? e : window.event;
	//console.log(""+e.keyCode);
        if(e.keyCode === 220){
	    if(twod==0) twod=1.0;
	    else twod=0;
            bufferMat.uniforms.twod.value = twod;
            bufferMat.needsUpdate = true;
        }
        if(e.keyCode === 13){
            toggleFullScreen();
            }
        if(e.keyCode === 32){
	    ssstop();
	    imgpaging(1);
        }
        if(e.keyCode === 8){
	    ssstop();
	    imgpaging(-1);
        }
        if(e.keyCode === 65){		//a
	    changess();
        }
        if(e.keyCode === 82){		//r
	    nCntdpt=0;
            bufferMat.uniforms.nCntdpt.value = nCntdpt;
            bufferMat.needsUpdate = true;
	    fclr = true;
            }
        if(e.keyCode === 40){		//d
	    nCntdpt--;
            bufferMat.uniforms.nCntdpt.value = nCntdpt;
            bufferMat.needsUpdate = true;
            }
        if(e.keyCode === 38){		//u
	    nCntdpt++;
            bufferMat.uniforms.nCntdpt.value = nCntdpt;
            bufferMat.needsUpdate = true;
            }
    });


    //SHADER CODE
    var VertexShaderCode =
        "varying vec2 iUv;"+

        "void main() {"+
            "iUv = uv;"+
            "vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);"+
            "gl_Position = projectionMatrix * modelViewPosition;"+
        "}";

    var FragmentShaderCode =
        "uniform sampler2D quiltTexture;"+
        "uniform float pitch;"+
        "uniform float tilt;"+
        "uniform float center;"+
        "uniform float invView;" +
        "uniform float flipX;" +
        "uniform float flipY;" +
        "uniform float subp;" +
        "uniform float tilesX;"+
        "uniform float tilesY;"+
        "uniform float windowInnerW;"+
        "uniform float windowInnerH;"+
        "uniform float windowOuterW;"+
        "uniform float windowOuterH;"+
        "uniform float windowInnerX;"+
        "uniform float windowInnerY;"+
        "uniform float windowOuterX;"+
        "uniform float windowOuterY;"+
        "uniform float screenW;"+
        "uniform float screenH;"+
        "uniform float nCntdpt;"+
        "uniform float twod;"+
        "varying vec2 iUv;"+

        "vec2 texArr(vec3 uvz) {"+
            "float f = uvz.z;"+
            "f = (f-0.5)*(nCntdpt*0.01);"+
            "float z = floor(uvz.z * tilesX * tilesY);"+
            "float x = (mod(z, tilesX) + uvz.x + f) / tilesX;"+
            "float y = (floor(z / tilesX) + uvz.y) / tilesY;"+
            "return vec2(x, y);"+
        "}"+

        "float Remap(float value, float from1, float to1, float from2, float to2){"+
           "return (value - from1) / (to1 - from1) * (to2 - from2) + from2;"+
        "}"+

        "void main()"+
        "{"+
            "vec4 rgb[3];"+
            "vec3 nuv = vec3(iUv.xy, 0.0);"+

            //Flip UVs if necessary
            "nuv.x = (1.0 - flipX) * nuv.x + flipX * (1.0 - nuv.x);"+
            "nuv.y = (1.0 - flipY) * nuv.y + flipY * (1.0 - nuv.y);"+
            "for (int i = 0; i < 3; i++) {"+
                "nuv.z = (iUv.x + float(i) * subp + iUv.y * tilt) * pitch - center;"+
                "nuv.z = mod(nuv.z + ceil(abs(nuv.z)), 1.0);"+
                "nuv.z = (1.0 - invView) * nuv.z + invView * (1.0 - nuv.z);" +
                "nuv.z = (1.0 - twod) * nuv.z + 0.55 * twod ;" +
                "rgb[i] = texture2D(quiltTexture, texArr(vec3(iUv.x, iUv.y, nuv.z)));"+
            "}"+

            "gl_FragColor = vec4(rgb[0].r, rgb[1].g, rgb[2].b, 1);"+
        "}"
    ;

    var TileEstimationFragmentShaderCode =
        "uniform sampler2D quiltTexture;"+
        "uniform float tilesX;"+
        "uniform float tilesY;"+
        "uniform float numViews;"+
        "uniform float paddingRateX;"+  // paddingX / quiltW
        "uniform float paddingRateY;"+  // paddingY / quiltH
        "varying vec2 iUv;"+

        "const int maxNumViews = 60;"+

        "vec2 quiltUv(vec2 uv, float tx, float ty) {"+
            "float u = (uv.x + tx) / ((1.0 - paddingRateX) * (tilesX + paddingRateX / tilesX));"+
            "float v = (uv.y + ty) / ((1.0 - paddingRateY) * (tilesY + paddingRateY / tilesY));"+
            "return vec2(u, v);"+
        "}"+

        "void main()"+
        "{"+
            "vec4 avgColor;"+    // Center image color instead of the average
            "vec4 sadColor;"+    // Sum of Absolute Difference
            
            "float cx = floor(tilesX / 2.0);"+
            "float cy = floor(tilesY / 2.0);"+
            "avgColor = texture2D(quiltTexture, quiltUv(iUv, cx, cy));"+

            "sadColor = vec4(0, 0, 0, 0);"+

            "for (int i = 0; i < maxNumViews; i++) {"+
                "float index = float(i);"+
                "if (index >= numViews) { break; };"+
                "float x = mod(index, tilesX);"+
                "float y = floor(index / tilesX);"+
                "sadColor += abs(texture2D(quiltTexture, quiltUv(iUv, x, y)) - avgColor);"+
            "}"+

            //"float maxCol = max(sadColor.r, max(sadColor.g, sadColor.b));"+
            //"sadColor /= maxCol;"+
            "sadColor /= (numViews <= 1.0 ? 1.0 : numViews - 1.0);"+
        
            "sadColor.a = 1.0;"+

            "gl_FragColor = sadColor;"+
            //"gl_FragColor = vec4(0,1,0,1);"+
        "}"
    ;

    //Call our initialization function once all our values are set
    init();
}