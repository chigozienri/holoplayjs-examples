# Holoplay.js
## This is a collection of examples of the use of Holoplay.js

To run the examples in this repository locally, you will need to [run a local server](https://docs.lookingglassfactory.com/developer-tools/three/localserver)

To view the examples in this repository, you will need to have a Looking Glass light field display, and have installed the [Holoplay Service](https://docs.lookingglassfactory.com/getting-started/holoplay-service#holoplay-service)

### The examples in holoplaycore use [holoplaycore 0.0.7](https://unpkg.com/holoplay-core@0.0.7/) or  [holoplaycore 0.0.8](https://unpkg.com/holoplay-core@0.0.8/)
- [Test Setup](holoplaycore/senddirect/index.html) shows how to directly send a quilt to a connected Looking Glass device using holoplaycore (without moving a window over). It is from [https://codesandbox.io/s/hardcore-butterfly-l5o9d](https://codesandbox.io/s/hardcore-butterfly-l5o9d) and is used [here](https://docs.lookingglassfactory.com/getting-started/portrait#test-your-setup).
- [Diagnostic](holoplaycore/diagnostic/index.html) displays the device calibration. It is the example from [https://unpkg.com/holoplay-core@0.0.7/examples/](https://unpkg.com/holoplay-core@0.0.7/examples/)

The following 4 examples come from [holoplaycore 0.0.8 examples](https://unpkg.com/holoplay-core@0.0.8/examples/)
- [calibrationDebugger](holoplaycore/0.0.8/calibrationDebugger/index.html) is the example referenced [here](https://docs.lookingglassfactory.com/holoplay-core/holoplaycorejs/api/examples#calibrationdebugger). This example demonstrates how to use HoloPlayCore.js to view calibration data and debug when there's a problem with the Looking Glass.
- [esModuleImport](holoplaycore/0.0.8/esModuleImport/index.html) is the example referenced [here](https://docs.lookingglassfactory.com/holoplay-core/holoplaycorejs/api/examples#esmoduleimport). This example demonstrates how to use the ES6 module version of HoloPlayCore.js, namely holoplaycore.module.js.
- [nodejs](holoplaycore/0.0.8/nodejs/main.js) is the example referenced [here](https://docs.lookingglassfactory.com/holoplay-core/holoplaycorejs/api/examples#nodejs). This example demonstrates how to use HoloPlayCore.js in Node.js. (You will need to set up a Node.js project to run this example.)
- [quiltLoader](holoplaycore/0.0.8/quiltLoader/index.html) is the example referenced [here](https://docs.lookingglassfactory.com/holoplay-core/holoplaycorejs/api/examples#quiltLoader). This is a more complex example, showing how to use the quilt viewing functionality in HoloPlayCore.js.

### The examples in lookingglass are from [https://docs.lookingglassfactory.com/developer-tools/three](https://docs.lookingglassfactory.com/developer-tools/three)
- [basic](lookingglass/examples/basic) shows how to use HoloPlay in place of a regular three.js camera
- [buttons](lookingglass/examples/buttons) shows how to receive events from the Looking Glass buttons (on models which have left/right/square/circle buttons)
- [debugoptions](lookingglass/examples/debugobptions) shows how to switch between display modes (2D/3D/Quilt)
- [gltf](lookingglass/examples/gltf) shows how to display a glTF

### The examples in stereo_jpn_org_lkg are from [http://stereo.jpn.org/lkg](http://stereo.jpn.org/lkg)

- [180 2D+Depth](stereo_jpn_org_lkg/180/180e.html) shows how to display a VR180 image with a RGB+Depth map image.
- [360 2D+Depth](stereo_jpn_org_lkg/360/360e.html) shows how to display a VR360 image with an equirectangular RGB+Depth map image.
- [Crystal Ball](stereo_jpn_org_lkg/ball/ball.html) shows how to display a skybox using 6 images, and add other objects into the scene.
- [Calibration](stereo_jpn_org_lkg/carib/index.html) shows how to access the calibration values.
- [Human's head](stereo_jpn_org_lkg/decals/decals.html) shows how to add a decal with texture and normal map to a model dynamically (Paint splatters are added to a head model where you click on the surface).
- [2D+Depth](stereo_jpn_org_lkg/depth/depthe.html) shows how to display a RGB+Depth map image.
- [3D Model 2D+Depth](stereo_jpn_org_lkg/depth3d/depth3de.html) shows how to
- [Dancing Doll](stereo_jpn_org_lkg/fbx/fbx.html) shows how to load an FBX.
- [FBX Viewer](stereo_jpn_org_lkg/fbxviewer/fbxviewer.html) shows how to load an FBX.
- [Half Width 2D+Depth](stereo_jpn_org_lkg/hwdepth/depthe.html) shows how to switch between half/full width.
- [Horizontal Shift movies](stereo_jpn_org_lkg/ido/idoe.html) shows how to
- [180 Horizontal Shift movies](stereo_jpn_org_lkg/ido180/ido180e.html) shows how to
- [Panorama](stereo_jpn_org_lkg/pano/pano.html) shows how to display an equirectangular spherical image (no depth data)
- [iPhone](stereo_jpn_org_lkg/portrait/portraite.html) shows how to display depth images from a dual lens iPhone (separate RGB and depth images)
- [Quilt](stereo_jpn_org_lkg/quilt/Quilte.html) shows how to display quilt images/movies.
- [Lucy model](stereo_jpn_org_lkg/refraction/refraction.html) shows how to display a skybox and light refraction through a transparent model.
- [Takamatsu](stereo_jpn_org_lkg/takamatsu/takamatsue.html) shows how to display depth-only grayscale images
- [Octaminator](stereo_jpn_org_lkg/tako/assimp.html) shows how to display assimp files (animated 3D octaminator model)
- [Little Tokyo](stereo_jpn_org_lkg/tokyo/tokyo.html) shows how to display animated glTFs (a diorama of a cute Tokyo block with animated tram)
- [Kandao](stereo_jpn_org_lkg/sample/360/index.html) shows how to display a VR360 image with an equirectangular RGB+Depth map image or movie.
- [Flowers](stereo_jpn_org_lkg/sample/flower/flower.html) shows how to animate a static RGB+Depth image.
- [Shift Movie misc](stereo_jpn_org_lkg/sample/ido/index.html) shows how to
- [Planet](stereo_jpn_org_lkg/sample/littlep/index.html) shows how to
- [Macro Room](stereo_jpn_org_lkg/sample/macro/index.html) shows how to display quilt images which use the different angles for animation instead of a 3D effect (like an animated lenticular postcard).
- [Depth misc](stereo_jpn_org_lkg/sample/misc/misc.html) shows various 2D RGB + Depth examples
- [Qoocam](stereo_jpn_org_lkg/sample/qoocam/index.html) shows various VR180 RGB + Depth examples
- [Stereo Club Tokyo](stereo_jpn_org_lkg/sample/sct/index.html) shows various 2D RGB + Depth examples
- [Sample Takamatsu](stereo_jpn_org_lkg/sample/takamatsu/index.html) shows various depth-only examples
- [Mt. Tsukuba](stereo_jpn_org_lkg/sample/tsukuba/index.html) shows a 2D RGB + Depth movie
- [Magic World](stereo_jpn_org_lkg/sample/magic.html) shows how to
- [Rose](stereo_jpn_org_lkg/sample/movie.html) shows how to
- [Sample Misc](stereo_jpn_org_lkg/sample/sshow.html) shows how to
