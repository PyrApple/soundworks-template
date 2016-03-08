// import soundworks library (client side) and custom experience
'use strict';

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

var _soundworksClient = require('soundworks/client');

var _soundworksClient2 = _interopRequireDefault(_soundworksClient);

var _PlayerExperienceJs = require('./PlayerExperience.js');

var _PlayerExperienceJs2 = _interopRequireDefault(_PlayerExperienceJs);

// files to load
var audioFiles = ['sounds/sound-welcome.mp3', 'sounds/sound-others.mp3'];

var init = function init() {
  // configuration options shared by the server (cf. `views/default.ejs`)
  var socketIO = window.CONFIG && window.CONFIG.SOCKET_CONFIG;
  var appName = window.CONFIG && window.CONFIG.APP_NAME;

  // configure client application
  _soundworksClient2['default'].client.init('player', { socketIO: socketIO, appName: appName });
  var experience = new _PlayerExperienceJs2['default'](audioFiles);

  // start the application
  _soundworksClient2['default'].client.start();
};

// initialize application when document is fully loaded
window.addEventListener('load', init);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9tYXR1c3pld3NraS9kZXYvY29zaW1hL2xpYi9zb3VuZHdvcmtzLXRlbXBsYXRlL3NyYy9jbGllbnQvcGxheWVyL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O2dDQUN1QixtQkFBbUI7Ozs7a0NBQ2IsdUJBQXVCOzs7OztBQUdwRCxJQUFNLFVBQVUsR0FBRyxDQUFDLDBCQUEwQixFQUFFLHlCQUF5QixDQUFDLENBQUM7O0FBRTNFLElBQU0sSUFBSSxHQUFHLFNBQVAsSUFBSSxHQUFTOztBQUVqQixNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDO0FBQzlELE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxNQUFNLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUM7OztBQUd4RCxnQ0FBVyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUFFLFFBQVEsRUFBUixRQUFRLEVBQUUsT0FBTyxFQUFQLE9BQU8sRUFBRSxDQUFDLENBQUM7QUFDeEQsTUFBTSxVQUFVLEdBQUcsb0NBQXFCLFVBQVUsQ0FBQyxDQUFDOzs7QUFHcEQsZ0NBQVcsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO0NBQzNCLENBQUE7OztBQUdELE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUMiLCJmaWxlIjoiL1VzZXJzL21hdHVzemV3c2tpL2Rldi9jb3NpbWEvbGliL3NvdW5kd29ya3MtdGVtcGxhdGUvc3JjL2NsaWVudC9wbGF5ZXIvaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBpbXBvcnQgc291bmR3b3JrcyBsaWJyYXJ5IChjbGllbnQgc2lkZSkgYW5kIGN1c3RvbSBleHBlcmllbmNlXG5pbXBvcnQgc291bmR3b3JrcyBmcm9tICdzb3VuZHdvcmtzL2NsaWVudCc7XG5pbXBvcnQgUGxheWVyRXhwZXJpZW5jZSBmcm9tICcuL1BsYXllckV4cGVyaWVuY2UuanMnO1xuXG4vLyBmaWxlcyB0byBsb2FkXG5jb25zdCBhdWRpb0ZpbGVzID0gWydzb3VuZHMvc291bmQtd2VsY29tZS5tcDMnLCAnc291bmRzL3NvdW5kLW90aGVycy5tcDMnXTtcblxuY29uc3QgaW5pdCA9ICgpID0+IHtcbiAgLy8gY29uZmlndXJhdGlvbiBvcHRpb25zIHNoYXJlZCBieSB0aGUgc2VydmVyIChjZi4gYHZpZXdzL2RlZmF1bHQuZWpzYClcbiAgY29uc3Qgc29ja2V0SU8gPSB3aW5kb3cuQ09ORklHICYmIHdpbmRvdy5DT05GSUcuU09DS0VUX0NPTkZJRztcbiAgY29uc3QgYXBwTmFtZSA9IHdpbmRvdy5DT05GSUcgJiYgd2luZG93LkNPTkZJRy5BUFBfTkFNRTtcblxuICAvLyBjb25maWd1cmUgY2xpZW50IGFwcGxpY2F0aW9uXG4gIHNvdW5kd29ya3MuY2xpZW50LmluaXQoJ3BsYXllcicsIHsgc29ja2V0SU8sIGFwcE5hbWUgfSk7XG4gIGNvbnN0IGV4cGVyaWVuY2UgPSBuZXcgUGxheWVyRXhwZXJpZW5jZShhdWRpb0ZpbGVzKTtcblxuICAvLyBzdGFydCB0aGUgYXBwbGljYXRpb25cbiAgc291bmR3b3Jrcy5jbGllbnQuc3RhcnQoKTtcbn1cblxuLy8gaW5pdGlhbGl6ZSBhcHBsaWNhdGlvbiB3aGVuIGRvY3VtZW50IGlzIGZ1bGx5IGxvYWRlZFxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBpbml0KTtcbiJdfQ==