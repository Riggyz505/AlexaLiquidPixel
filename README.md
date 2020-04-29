# AlexaLiquidPixel
This is a project where I use my Liquid Pixel lights and have them controlled by an Amazon Alexa.

Here is the documentation I followed to start my boilerplate code:
https://developer.amazon.com/en-US/docs/alexa/smarthome/understand-the-smart-home-skill-api.html

For the account linking step I decided to use Login With Amazon because it was free with my dev account, use this documentation on howto set it up:
https://developer.amazon.com/blogs/post/Tx3CX1ETRZZ2NPC/Alexa-Account-Linking-5-Steps-to-Seamlessly-Link-Your-Alexa-Skill-with-Login-wit

The lightingEdge.js file is meant to be ran on the device with the Liquid Pixel assets plugged into them. You will need npm to install the serialport module and you will need to open a port of your choosing so that the UDP server can be reached by the Lambda container.

The index.js file is meant to be ran in place of the index.js you make in the boilerplate. Please do note that you will need to add your own endpoints to the system. A template for them has been put in the JSON file.

