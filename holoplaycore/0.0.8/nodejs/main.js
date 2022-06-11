const HoloPlayCore = require('https://unpkg.com/holoplay-core@0.0.7/dist/holoplaycore.min.js');

const client = new HoloPlayCore.Client(
    (msg) => {
      console.log('Calibration loaded', msg);
      process.exit();
    },
    (err) => {
      console.error('Error while creating client.', err);
      process.exit();
    });
