//Copyright 2019 Looking Glass Factory Inc.
//All rights reserved.
//Unauthorized copying or distribution of this file, and the source code contained herein, is strictly prohibited.

function HoloPlay(scene, camera, renderer, focalPointVector, constantCenter, hiResRender){
    var scope = this;
    //This makes sure we don't try to render before initializing
    var initialized = false;

    var curnum=0;
    
    var interval;
    var lastScreenX;
    var lastScreenY;
    var outOfWindow = false;
    
    //private variables
    var _renderer, _scene, _camera;
    var threeD;
    var jsonObj;
    
    //Stores the distance to the focal plane
    //Let's us change the rotation or position of the camera and still have it work
    //Change this in order to change the focus of the camera after runtime
    var holdCenter, cameraForward, viewScale, center;
    
    //Quilt properties
    var tilesX, tilesY, numViews;
    
    var bufferSceneRender;

    var renderResolution;
    //Camera properties
    var viewCone;
    var nCycle;
    var nCyclecur;
    var nCntdpt;
    var nRev;
    var fclr;
    var nFull=0;
    var stStyle;
    var buttonMes;
    var startTime;
    var HSMes=0;
    
    //Render scenes
    var bufferMat, finalRenderScene, finalRenderCamera;

    //Looking Glass buttons
    var buttons, buttonsLastFrame, buttonsAvailable;
    var buttonNames = [ "square", "left", "right", "circle" ];
    
    //A public bool to indicate if you want to use buttons - set to "false" if not to save processing time
    this.useButtons = true;
    
    var defaultCalibration = {"configVersion":"1.0","serial":"00112","pitch":{"value":49.96086120605469},"slope":{"value":5.502500057220459},"center":{"value":0.14347827434539795},"viewCone":{"value":40.0},"invView":{"value":1.0},"verticalAngle":{"value":0.0},"DPI":{"value":355.0},"screenW":{"value":2560.0},"screenH":{"value":1600.0},"flipImageX":{"value":0.0},"flipImageY":{"value":0.0},"flipSubp":{"value":0.0}};
    
    function init()
    {
	doLoadEEPROM(true);
        threeD = true;
        jsonObj = null;
	fclr = true;

	nCycle=4;
	nCyclecur=nCycle;
	nRev=1;
	nCntdpt=0;

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

        //Locks the center to a fixed position if true, which is the default
        //Good for orbit controls, but should be false for things like first-person controls
        holdCenter = constantCenter;

        cameraForward = new THREE.Vector3();
        camera.getWorldDirection(cameraForward);

        //Buffer scene
        renderResolution = 2048;
        tilesX = 4;
        tilesY = 8;
        if(hiResRender){
            renderResolution = 4096;
            tilesX = 5;
            tilesY = 9;
        } 

        bufferSceneRender = new THREE.WebGLRenderTarget(renderResolution, renderResolution, {format: THREE.RGBFormat});

         //Capture settings
        numViews = tilesX * tilesY;
        viewCone = 40;
        
        //render texture dimensions
        var renderSizeX = renderResolution / tilesX;
        var renderSizeY = renderResolution / tilesY;

        //Init shader uniforms
        var uniforms =
        {
            quiltTexture: {value: bufferSceneRender},
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
            curnm: {value:0},
            nCntdpt: {value:0}
        };

        //Set up the shader
        var shaderProperties = {
            uniforms: uniforms,
            vertexShader: VertexShaderCode,
            fragmentShader: FragmentShaderCode
        };

        //Apply the shader to the buffer material
        bufferMat = new THREE.ShaderMaterial(shaderProperties);

        //Set up the final render scene
        finalRenderScene = new THREE.Scene();
        var renderPlaneGeometry = new THREE.PlaneGeometry(window.innerWidth, window.innerHeight);

        var renderPlane = new THREE.Mesh(renderPlaneGeometry, bufferMat);
        finalRenderScene.add(renderPlane);

        finalRenderCamera = new THREE.OrthographicCamera(-window.innerWidth/2, window.innerWidth/2, window.innerHeight/2, -window.innerHeight/2, 1, 3);
        finalRenderCamera.position.z = 2;
        finalRenderScene.add(finalRenderCamera);

        buttonsLastFrame = [ false, false, false, false ];
        //Add the user buttons
        setupFullScreen();

    };

    //******HTML SETUP******//

    //Create the dom element for the fullscreen button
    function makeFullScreenButton(){
        var newHTML =
            '<input type="button" style="margin:20px; position:fixed; top:0px; right:0px; z-index: 10000; height:50px; width:200px;" id="fullscreenButton" value="Enter Full Screen Mode Ver0.3"/>';

        var buttonDiv = document.createElement("div");

        buttonDiv.innerHTML = newHTML;

        buttonDiv.setAttribute("id", "fullscreen");

        document.body.appendChild(buttonDiv);

        buttonMes = document.createElement("div");

	stStyle='<input type="button" style="font-size: 600%; margin:20px; position:fixed; top:0px; left:0px; z-index: 10000; height:120px; width:900px;" value="';

 //       buttonMes.innerHTML = stStyle+tilesX+'x'+tilesY+'"/>';

        buttonMes.setAttribute("id", "message");

        document.body.appendChild(buttonMes);
	buttonMes.style.visibility ="hidden";
	HSMes=0;

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
            fullscreenon();
        });
    };
	
    //******CALIBRATION SETUP******//
    
	function applyCalibration (calibration_obj)
	{
        if(calibration_obj === undefined || calibration_obj === ""){
            jsonObj = defaultCalibration;
            alert("No Looking Glass display connected; using default calibration data. Please ensure your Looking Glass is connected to your computer via USB and reload the page.")
        } else {
            jsonObj = JSON.parse(calibration_obj);
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
        
        
        //should we invert?
        bufferMat.uniforms.invView.value = invView;

        //Should we flip it for peppers?
        bufferMat.uniforms.flipX.value = flipX;
        bufferMat.uniforms.flipY.value = flipY;

        bufferMat.uniforms.subp.value = 1/(screenW * 3);

        //tiles
        bufferMat.uniforms.tilesX.value = tilesX;
        bufferMat.uniforms.tilesY.value = tilesY;
        bufferMat.uniforms.curnm.value = 0;
	bufferMat.uniforms.nCntdpt.value = nCntdpt;

        bufferMat.needsUpdate = true;
    };

    //*******LOGIC FOR CAPTURING MULTIPLE VIEWS******//
	var now = window.performance && (
	    performance.now || 
	    performance.mozNow || 
	    performance.msNow || 
	    performance.oNow || 
	    performance.webkitNow );

	var getTime = function() {
	    return ( now && now.call( performance ) ) || ( new Date().getTime() );
	   }   
    //Render the different views
    function captureViews(scene, camera)
    {
        var renderSizeX = renderResolution / tilesX;
        var renderSizeY = renderResolution / tilesY;
	numViews=tilesX*tilesY;

	x=curnum % tilesX;
	y=Math.floor(curnum / tilesX);
//	console.log(curnum+","+x+","+y);
	renderer.autoClearColor = false;
//	renderer.autoClear = false;
	
	renderer.setRenderTarget(bufferSceneRender);
	renderer.setViewport(x * renderSizeX, y * renderSizeY, renderSizeX, renderSizeY);
	if(fclr){
		renderer.clear();
		fclr = false;
		}
//	camera.viewport = new THREE.Vector4( 0, 0, renderResolution, renderResolution );
        renderer.render(scene,camera);

	var fnum=curnum/(tilesX*tilesY);
//	console.log(curnum+","+fnum);
	
	var tt=getTime()-startTime;
	tt=Math.round(1000/tt);

	buttonMes.innerHTML = stStyle+tilesX+'x'+tilesY+' Dpt='+nCntdpt+' FPS='+tt+'"/>';
	startTime = getTime();

        bufferMat.uniforms.curnm.value = fnum;
        bufferMat.needsUpdate = true;

	curnum++;
	if(curnum>=numViews) curnum=0;

    };
          

    HoloPlay.prototype.valuerest2 = function(){
	    nCycle=4;
            nCyclecur=nCycle;
            tilesX = 5;
            tilesY = 9;
	    nCntdpt=0;
            bufferMat.uniforms.nCntdpt.value = nCntdpt;
            bufferMat.uniforms.tilesX.value = tilesX;
            bufferMat.uniforms.tilesY.value = tilesY;
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

	nCyclecur--;
	if(nCyclecur>0){return;}
	nCyclecur=nCycle;
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
            
	captureViews(scene, camera);

	renderer.setRenderTarget( null );
	renderer.setViewport(0,0,window.innerWidth,window.innerHeight);
	renderer.render(finalRenderScene, finalRenderCamera);

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
	fromjsfnc(e.keyCode);
//	console.log("e.keyCode="+e.keyCode);
        if(e.keyCode === 13){
            toggleFullScreen();
            }
        if(e.keyCode === 68){		//d:Display
            HSMes=(HSMes+1)%2;
	    if(HSMes==1) buttonMes.style.visibility ="visible";
	    else buttonMes.style.visibility ="hidden";
            }
        if(e.keyCode === 88){		//x
	    nRev=!nRev;
            bufferMat.uniforms.invView.value = nRev;
            bufferMat.needsUpdate = true;
            }
        if(e.keyCode === 81){		//q
	    nCycle=4;
            nCyclecur=nCycle;
            tilesX = 4;
            tilesY = 6;
	    nCntdpt=0;
            bufferMat.uniforms.nCntdpt.value = nCntdpt;
            bufferMat.uniforms.tilesX.value = tilesX;
            bufferMat.uniforms.tilesY.value = tilesY;
            bufferMat.needsUpdate = true;
	    fclr = true;
            }
        if(e.keyCode === 87){		//w
	    nCycle=4;
            nCyclecur=nCycle;
            tilesX = 4;
            tilesY = 8;
	    nCntdpt=0;
            bufferMat.uniforms.nCntdpt.value = nCntdpt;
            bufferMat.uniforms.tilesX.value = tilesX;
            bufferMat.uniforms.tilesY.value = tilesY;
            bufferMat.needsUpdate = true;
	    fclr = true;
            }
        if(e.keyCode === 69 || e.keyCode === 67){		//e
	    nCycle=4;
            nCyclecur=nCycle;
            tilesX = 5;
            tilesY = 9;
	    nCntdpt=0;
            bufferMat.uniforms.nCntdpt.value = nCntdpt;
            bufferMat.uniforms.tilesX.value = tilesX;
            bufferMat.uniforms.tilesY.value = tilesY;
            bufferMat.needsUpdate = true;
	    fclr = true;
            }
        if(e.keyCode === 82){		//r
	    nCycle=4;
            nCyclecur=nCycle;
            tilesX = 6;
            tilesY = 10;
	    nCntdpt=0;
            bufferMat.uniforms.nCntdpt.value = nCntdpt;
            bufferMat.uniforms.tilesX.value = tilesX;
            bufferMat.uniforms.tilesY.value = tilesY;
            bufferMat.needsUpdate = true;
	    fclr = true;
            }
        if(e.keyCode === 37){		//l
	    nCycle--;
	    if(nCycle<1) nCycle=1;
            nCyclecur=nCycle;
            }
        if(e.keyCode === 39){		//r
	    nCycle++;
            nCyclecur=nCycle;
            }
        if(e.keyCode === 40){		//d
	    nCntdpt--;
            if(nRev) bufferMat.uniforms.nCntdpt.value = nCntdpt;
            else bufferMat.uniforms.nCntdpt.value = -nCntdpt;
            bufferMat.needsUpdate = true;
            }
        if(e.keyCode === 38){		//u
	    nCntdpt++;
            if(nRev) bufferMat.uniforms.nCntdpt.value = nCntdpt;
            else bufferMat.uniforms.nCntdpt.value = -nCntdpt;
            bufferMat.needsUpdate = true;
            }
//	console.log(nCntdpt+","+nCntdpt);
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
        "uniform float curnm;"+
        "uniform float nCntdpt;"+
        "varying vec2 iUv;"+

        "vec2 texArr(vec3 uvz) {"+
            "float f = uvz.z - curnm;"+
            "f = (1.0+f)*(1.0-sign(f))/2.0 + f*(1.0+sign(f))/2.0;"+
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
                "nuv.z = (iUv.x + float(i) * subp + iUv.y * tilt) * pitch - center - (invView*2.0-1.0)*curnm;"+
                "nuv.z = mod(nuv.z + ceil(abs(nuv.z)), 1.0);"+
                "nuv.z = (1.0 - invView) * nuv.z + invView * (1.0 - nuv.z);" +
                "rgb[i] = texture2D(quiltTexture, texArr(vec3(iUv.x, iUv.y, nuv.z)));"+
   //             "rgb[i] = texture2D(quiltTexture, vec2(nuv.x, nuv.y));"+
            "}"+

            "gl_FragColor = vec4(rgb[0].r, rgb[1].g, rgb[2].b, 1);"+
//                "gl_FragColor = vec4(nuv.x, nuv.y, 0, 0);"+
        "}"
    ;

    //Call our initialization function once all our values are set
    init();
}