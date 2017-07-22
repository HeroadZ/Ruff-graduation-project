'use strict';

// init
var button_k2,
    led,
    lightSensor,
    soundSensor,
    humanSensor,
    lcd,
    buzzer;
var h = 0,
    s = 0,
    l = 0;

//led status init
var ledIsOn = false;

//monitor init
var monitorModelFlag = false;

//sleep init
var sleepModelFlag = false;
var nightLightValue = 10;

//responsive init
var responsiveModelFlag = false;

//weixin init
var weixinSecret = "";

/**
 * require module
 */
var http = require("http");
var url = require('url');
var queryString = require('querystring');
var EventEmitter = require('events');


var Server = require('home').Server;
var server = new Server();

require('promise');


/**
 * path init
 */
server.get('/modeStatus', function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return {
        sleepModelFlag: sleepModelFlag,
        responsiveModelFlag: responsiveModelFlag,
        monitorModelFlag: monitorModelFlag
    };
});
server.get('/sleepModelToggle', function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    sleepModelFlag = !sleepModelFlag;
    sleepLight.renderSleep(sleepModelFlag);
    return {
        sleepModelFlag: sleepModelFlag
    };
});
server.get('/responsiveModelToggle', function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    responsiveModelFlag = !responsiveModelFlag;
    responsiveLight.renderResponsive(responsiveModelFlag);
    return {
        responsiveModelFlag: responsiveModelFlag
    };
});
server.get('/monitorModelToggle', function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    monitorModelFlag = !monitorModelFlag;
    monitor.renderMonitor(monitorModelFlag);
    return {
        monitorModelFlag: monitorModelFlag
    };
});
server.get('/colorChange', function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    var urlObj = url.parse(req.url);
    var queryObj = queryString.parse(urlObj.query);
    var color = queryObj.color.toLowerCase();
    var sColorChange = [];
    for (var i = 1; i < 7; i += 2) {
        sColorChange.push(parseInt("0x" + color.slice(i, i + 2)));
    }
    led.setRGB(sColorChange);
    console.log('color Change: ' + color);
    lcd.clear();
    lcd.print('color change');
    return {
        colorChange: true
    };
});


$.ready(function (error) {
    if (error) {
        console.log(error);
        return;
    }

    server.listen(6318);


    button_k2 = $('#button-k2');
    led = $('#led');
    lightSensor = $('#lightSensor');
    soundSensor = $('#soundSensor');
    humanSensor = $('#humanSensor'); //init time 1 minute
    lcd = $('#lcd');
    buzzer = $('#buzzer');

    lcd.clear();
    lcd.print('welcome');
    buttonCon();
});

$.end(function () {
    led = $('#led');
    led.turnOff();
    console.log('shut down.');
});

/**
 * button control
 */
var buttonCon = function () {
    button_k2.on('push', function () {
        console.log('turnOff led.');
        lcd.clear();
        lcd.print('goodbye');
        led.turnOff();
        ledIsOn = false;
        sleepLight.renderSleep(sleepModelFlag);
    });
};


/**
 * monitor Module
 * @type {{alarmLight, wxPush, monitorCallback, renderMonitor}}
 */
var monitor = (function () {
    var alarmHandler;
    var autoMonitorHandler;
    var colors = [[0xff, 0x0, 0x0], [0x0, 0x0, 0xff]];
    var index = 0;

    var alarmLight = function () {
        alarmHandler = setInterval(function () {
            led.setRGB(colors[index % 2]);
            index = (index + 1) % 2;
        }, 800);
        ledIsOn = true;
        buzzer.turnOn();
        setTimeout(function () {
            clearInterval(alarmHandler);
            led.turnOff();
            ledIsOn = false;
            buzzer.turnOff();
        }, 5000);
    };

    var wxPush = function () {
        var myDate = new Date();
        var time = myDate.getFullYear() + '/' + (myDate.getMonth() + 1) + '/' + myDate.getDate() + '/' + (myDate.getHours() + 8) + ':' + myDate.getMinutes();
        var url = 'http://sc.ftqq.com/' + weixinSecret + '.send?' + 'text='
            + encodeURIComponent('家中有人请注意！') + '&desp=' + time;
        http.get(url, function (res) {
            console.log("response: " + res.statusCode);
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                console.log(chunk);
            });
        });
    };

    var monitorCallback = function () {
        console.log('human detected.');
        humanSensor.removeListener('presence', monitor.monitorCallback);
        monitor.alarmLight();
        monitor.wxPush();
        console.log('push message to wx.');
        autoMonitorHandler = setTimeout(function () {
            monitor.renderMonitor(monitorModelFlag);
        }, 60000);
    };

    var renderMonitor = function (flag) {
        if (flag) {
            monitorModelFlag = true;
            console.log('monitor On.');
            lcd.clear();
            lcd.print('monitor On');
            humanSensor.on('presence', monitor.monitorCallback);
        } else {
            monitorModelFlag = false;
            humanSensor.removeListener('presence', monitor.monitorCallback);
            clearTimeout(autoMonitorHandler);
            led.turnOff();
            ledIsOn = false;
            console.log('monitor Off.');
            lcd.clear();
            lcd.print('monitor Off');
        }
    };

    return {
        alarmLight: alarmLight,
        wxPush: wxPush,
        monitorCallback: monitorCallback,
        renderMonitor: renderMonitor
    }
})();

/**
 * sleep module
 * @type {{ledTurnOn, sleepDetection, renderSleep}}
 */
var sleepLight = (function () {
    var sleepHandler;

    var ledTurnOn = function () {
        console.log('sound detected');
        if (ledIsOn === false) {
            var i = 0;
            var lightGradualHandler = setInterval(function () {
                if (i >= 255) {
                    i = 255;
                    clearInterval(lightGradualHandler);
                }
                led.setRGB([i, i, i]);
                i += 10;
            }, 500);
            console.log('led is turning on Gradually.');
            lcd.clear();
            lcd.print('led on slowly');
            ledIsOn = true;
            soundSensor.disable();
            setTimeout(function () {
                led.turnOff();
                ledIsOn = false;
                console.log('led turnOff after 60s.');
                sleepLight.renderSleep(sleepModelFlag);
            }, 60000);
        } else {
            console.log('led has been on.');
        }
    };

    var sleepDetection = function () {
        if (!ledIsOn) {
            var nightFlag = false;

            var getIlluminancePromise = new Promise(function (resolve) {
                lightSensor.getIlluminance(function (error, value) {
                    resolve(value);
                });
            });

            getIlluminancePromise
                .then(function (illuminance) {
                    if (illuminance <= nightLightValue) {
                        if (nightFlag) {
                            return false;
                        } else {
                            //wait 5s and detect again
                            console.log('night detected.');
                            setTimeout(function () {
                                lightSensor.getIlluminance(function (error, value) {
                                    if (value <= nightLightValue) {
                                        console.log('night confirm after 3s.');
                                        nightFlag = true;
                                        clearInterval(sleepHandler);
                                        soundSensor.enable();

                                        soundSensor.once('sound', sleepLight.ledTurnOn);
                                    }
                                });
                            }, 3000);
                        }
                    } else {
                        nightFlag = false;
                    }
                })
        }
    };

    var renderSleep = function (flag) {
        if (flag) {
            sleepModelFlag = true;
            clearInterval(sleepHandler);
            sleepHandler = setInterval(sleepLight.sleepDetection, 5000);
            sleepLight.sleepDetection();
            console.log('sleep On.');
            lcd.clear();
            lcd.print('sleep On');
        } else {
            sleepModelFlag = false;
            clearInterval(sleepHandler);
            soundSensor.disable();
            console.log('sleep Off.');
            lcd.clear();
            lcd.print('sleep Off');
        }
    };

    return {
        ledTurnOn: ledTurnOn,
        sleepDetection: sleepDetection,
        renderSleep: renderSleep
    }
})();

/**
 * responsiveLight Module
 * @type {{rgbToHsl, hslToRgb, setLight, renderResponsive}}
 */
var responsiveLight = (function () {
    var responsiveHandler;

    var hslToRgb = function (h, s, l) {
        var r, g, b;

        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            var hue2rgb = function hue2rgb(p, q, t) {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };

            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    };

    var rgbToHsl = function (r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h /= 6;
        }

        return [h, s, l];
    };

    var setLight = function () {

        var getIlluminancePromise = new Promise(function (resolve) {
            lightSensor.getIlluminance(function (error, value) {
                resolve(value);
            });
        });

        getIlluminancePromise
            .then(function (illuminance) {
                console.log('亮度: ', illuminance);

                // compute lightness
                // l > 0.5 boom set threshold
                //max 20000 min 0
                l = illuminance / 5000;
                //set min value
                l = l < 0.002 ? 0.002 : l;
                //if l > max , turn Off
                l = l > 0.495 ? 0 : l;

                var getRGBPromise = new Promise(function (resolve) {
                    led.getRGB(function (error, rgb) {
                        var r = rgb[0] === undefined ? 255 : rgb[0];
                        var g = rgb[1] === undefined ? 255 : rgb[1];
                        var b = rgb[2] === undefined ? 255 : rgb[2];
                        resolve([r, g, b]);
                    });
                });
                getRGBPromise.then(function (rgbArr) {
                    var hslArr = responsiveLight.rgbToHsl(rgbArr[0], rgbArr[1], rgbArr[2]);
                    h = hslArr[0];
                    s = hslArr[1];

                    var newrgb = responsiveLight.hslToRgb(h, s, l);
                    led.setRGB(newrgb);
                });
            });

    };

    var renderResponsive = function (flag) {
        if (flag) {
            responsiveModelFlag = true;
            responsiveHandler = setInterval(responsiveLight.setLight, 1000);
            ledIsOn = true;
            console.log('responsive On.');
            lcd.clear();
            lcd.print('responsive On');
        } else {
            responsiveModelFlag = false;
            clearInterval(responsiveHandler);
            led.turnOff();
            ledIsOn = false;
            console.log('responsive Off.');
            lcd.clear();
            lcd.print('responsive Off');
        }
    };

    return {
        rgbToHsl: rgbToHsl,
        hslToRgb: hslToRgb,
        setLight: setLight,
        renderResponsive: renderResponsive
    }
})();

