master: [![Circle CI](https://circleci.com/gh/HR-Data-Geyser/Data-Geyser/tree/master.png?style=badge&circle-token=6cffbaab360c3e24eeb4b3fffe1afb7da7c389ff)](https://circleci.com/gh/HR-Data-Geyser/Data-Geyser/tree/master) develop: [![Circle CI](https://circleci.com/gh/HR-Data-Geyser/Data-Geyser/tree/develop.png?style=badge&circle-token=6cffbaab360c3e24eeb4b3fffe1afb7da7c389ff)](https://circleci.com/gh/HR-Data-Geyser/Data-Geyser/tree/develop)
#Data Geyser

Data Geyser is a virtual reality enabled, immersive and interactive data visualization experience combining art and cutting-edge technology. Users can manipulate a 3D globe to view geographic and time-series Twitter data from different angles, and trigger visualization events. The triggers display a variety of stunning, interactive data-relevant visualizations.

The app can be experienced either in the browser or using the Oculus Rift headset. The app can be controlled using either the mouse or Leap Motion Controller.

Deployed app is based on Master branch, and viewable at: datageyser.herokuapp.com

![Alt text] (/client/assets/images/screenshot-globe.png?raw=true)
![Alt text] (/client/assets/images/screenshot-geyser.png?raw=true)

## Installation

To install, fork and clone the repo. To install dependencies run:

```
npm install && bower install
```

To start the app, ensure no instances of MongoDB are running and then run:

```
grunt serve
```

To configure Twitter API keys using your Twitter auth info, edit the following:

```
'use strict';

module.exports = {
  DOMAIN: 'http://localhost:9000',
  SESSION_SECRET: "OXfDXXBfFKML4fBaQDb9ptujbEqTVS7yu7VP9LGJBGSUw",
  TWITTER_ACCESS_TOKEN: 'Enter token here',
  TWITTER_ACCESS_TOKEN_SECRET: 'Enter token secret here',
  TWITTER_CONSUMER_KEY: 'Enter consumer key here',
  TWITTER_CONSUMER_SECRET: 'Enter consumer secret here',
  // Control debug level for modules using visionmedia/debug
  DEBUG: ''
};

```
and save locally as:

```
server/config/local.env.js
```

You will then need to uncomment the following admin controls once properly configured:

*Insert appropriate lines when ready*

To launch browser (example is using Chrome) without security to enable flying photos by removing CORS limitations: 

```
open -a Chrome --args --disable-web-security
```

To utilize Oculus, you must use a VR enabled browser such as Firefox Nightly (http://blog.bitops.com/blog/2014/08/20/updated-firefox-vr-builds/) or Chromium (http://blog.tojicode.com/2014/07/bringing-vr-to-chrome.html). 
## Usage

Globe can be controlled by default by using the mouse, but also supports the Leap Motion Controller. The Leap controls movement by reading the absolute position of the hand relative to the controller, not by registering relative movement. To zoom in, hold hand closer to controller (y-axis)...zoom out by holding hand farther away. Rotate left and right by holding hand at left or right sides (x-axis) of controller. Rotate up and down by moving hand forward or backwards along z-axis.

To visualize in Oculus, attach unit and select the Oculus option. This will also remove the GUI from the view, so adjustments to preferred visualization must be made prior to launching with Oculus. 

Additional app usage instructions can be found in the About route of the site.

## Contributing

See issues for a variety of features / fixes identified as potential contributions.

See [CONTRIBUTING.md](CONTRIBUTING.md).

## History

Data Geyser is a project developed in collaboration with Kine-tech Arts. It has been showcased at Mozilla at the Codame VR Event in San Francisco and has been featured in various online publications.

## Credits

Data Geyser was created by a team of 4 software engineers:

Brian Iversen, 
Tom Varik, 
Steve Sharp, 
Carl Goldberg

In collaboration with Kine-tech Arts:
Weidong Yang,
Travis Bennett

## License

[LICENSE] (LICENSE.md)