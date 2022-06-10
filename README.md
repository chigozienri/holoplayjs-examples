# Holoplay.js
## This is a collection of examples of the use of Holoplay.js

To run the examples in this repository locally, you will need to [run a local server](https://docs.lookingglassfactory.com/developer-tools/three/localserver)

To view the examples in this repository, you will need to have a Looking Glass light field display, and have installed the [Holoplay Service](https://docs.lookingglassfactory.com/getting-started/holoplay-service#holoplay-service)

The examples in holoplaycore use [holoplaycore](https://unpkg.com/browse/holoplay-core@0.0.7).
- [Test Setup](holoplaycore/senddirect/index.html) shows how to directly send a quilt to a connected Looking Glass device using holoplaycore (without moving a window over). It is from [https://codesandbox.io/s/hardcore-butterfly-l5o9d](https://codesandbox.io/s/hardcore-butterfly-l5o9d) and is used [here](https://docs.lookingglassfactory.com/getting-started/portrait#test-your-setup).
- [Diagnostic](holoplaycore/diagnostic/index.html) displays the device calibration. It is the example from [https://unpkg.com/browse/holoplay-core@0.0.7/examples/](https://unpkg.com/browse/holoplay-core@0.0.7/examples/)

The examples in lookingglass are from [https://docs.lookingglassfactory.com/developer-tools/three](https://docs.lookingglassfactory.com/developer-tools/three)
- [basic](lookingglass/examples/basic) shows how to use HoloPlay in place of a regular three.js camera
- [buttons](lookingglass/examples/buttons) shows how to receive events from the Looking Glass buttons (on models which have left/right/square/circle buttons)
- [debugoptions](lookingglass/examples/debugobptions) shows how to switch between display modes (2D/3D/Quilt)
- [gltf](lookingglass/examples/gltf) shows how to display a glTF

The examples in stereo_jpn_org_lkg are from [http://stereo.jpn.org/lkg](http://stereo.jpn.org/lkg)
- [Carib](stereo_jpn_org_lkg/carib/index.html) shows how to access the calibration values.
