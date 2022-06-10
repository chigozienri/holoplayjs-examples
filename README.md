# Holoplay.js
## This is a collection of examples of the use of Holoplay.js

To run the examples in this repository locally, you will need to [run a local server](https://docs.lookingglassfactory.com/developer-tools/three/localserver)

To view the examples in this repository, you will need to have a Looking Glass light field display, and have installed the [Holoplay Service](https://docs.lookingglassfactory.com/getting-started/holoplay-service#holoplay-service)

The example in holoplaycore is from [https://codesandbox.io/s/hardcore-butterfly-l5o9d](https://codesandbox.io/s/hardcore-butterfly-l5o9d)
- [Test Setup](holoplaycore/index.html) shows how to directly send a quilt to a connected Looking Glass device using holoplaycore (without moving a window over)

The examples in lookingglass are from [https://docs.lookingglassfactory.com/developer-tools/three](https://docs.lookingglassfactory.com/developer-tools/three)
- [lookingglass/examples/basic](basic) shows how to use HoloPlay in place of a regular three.js camera
- [lookingglass/examples/buttons](buttons) shows how to receive events from the Looking Glass buttons (on models which have left/right/square/circle buttons)
- [lookingglass/examples/debugobptions](debugoptions) shows how to switch between display modes (2D/3D/Quilt)
- [lookingglass/examples/gltf](gltf) shows how to display a glTF

The examples in stereo_jpn_org_lkg are from [http://stereo.jpn.org/lkg](http://stereo.jpn.org/lkg)
- [Carib](stereo_jpn_org_lkg/carib/index.html) shows how to access the calibration values.
