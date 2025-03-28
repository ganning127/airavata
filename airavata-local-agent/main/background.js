/*****************************************************************
*
*  Licensed to the Apache Software Foundation (ASF) under one  
*  or more contributor license agreements.  See the NOTICE file
*  distributed with this work for additional information       
*  regarding copyright ownership.  The ASF licenses this file  
*  to you under the Apache License, Version 2.0 (the           
*  "License"); you may not use this file except in compliance  
*  with the License.  You may obtain a copy of the License at  
*                                                              
*    http://www.apache.org/licenses/LICENSE-2.0                
*                                                              
*  Unless required by applicable law or agreed to in writing,  
*  software distributed under the License is distributed on an 
*  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY      
*  KIND, either express or implied.  See the License for the   
*  specific language governing permissions and limitations     
*  under the License.                                          
*                                                              
*
*****************************************************************/
import path from 'path';
import { app, ipcMain, dialog, session, Menu, shell } from 'electron';
const url = require('node:url');
import serve from 'electron-serve';
import { createWindow } from './helpers';
const fs = require('fs');
import log from 'electron-log/main';
import Store from 'electron-store';


const isProd = process.env.NODE_ENV === 'production';

let hasQuit = false;
if (isProd) {
  serve({ directory: 'app' });
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`);
}

let mainWindow;
const TOKEN_FILE = '~/csagent/token/keys.json';
let BASE_URL = 'this value will be replaced';

// ----- OUR CUSTOM FUNCTIONS -----
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('csagent', process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient('csagent');
}

const openLoginCallback = async (url) => {
  log.info("Opening login callback");
  const rawCode = /code=([^&]*)/.exec(url) || null;
  const code = (rawCode && rawCode.length > 1) ? rawCode[1] : null;

  if (isProd) {
    await mainWindow.loadURL(`app://./login-callback?code=${code}`);
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/login-callback?code=${code}`);
  }
};

const getToken = async (url) => {
  const rawCode = /code=([^&]*)/.exec(url) || null;
  const code = (rawCode && rawCode.length > 1) ? rawCode[1] : null;

  if (code) {
    const resp = await fetch(`${BASE_URL}/auth/get-token-from-code/?code=${code}&isProd=${isProd}`);
    const data = await resp.json();
    return data;
  } else {
    return null;
  }
};

// ----- END OF OUR CUSTOM FUNCTIONS -----


const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory, additionalData) => {
    // catches windows and linux
    log.error("In second-instance");
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }

    log.info("Command line: ", commandLine);

    log.info('Additional data: ', additionalData);

    const url = commandLine.pop();

    log.info("URL: ", url);

    openLoginCallback(url);
  });

  app.on('open-url', async (event, url) => {
    // catches mac
    log.info("In open-url");
    openLoginCallback(url);
  });

  // Create mainWindow, load the rest of the app, etc...
  app.whenReady().then(async () => {
    mainWindow = createWindow('main', {
      width: 1700,
      height: 1000,
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: false,
      },
      'node-integration': true,

    });

    log.info("App is now ready");

    app.commandLine.appendSwitch('ignore-certificate-errors');

    session.defaultSession.clearStorageData([], (data) => {
      log.info("Cleared storage data", data);
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      // open external URLs in browser, not in the app
      shell.openExternal(url);
      return { action: 'deny' };
    });

    mainWindow.on('close', function (e) {
      var choice = dialog.showMessageBoxSync(this,
        {
          type: 'question',
          buttons: ['Yes', 'No'],
          title: 'Confirm',
          message: 'Are you sure you want to close the local agent?'
        });
      if (choice == 1) {
        e.preventDefault();
      } else {
        hasQuit = true;
      }
    });

    if (isProd) {
      await mainWindow.loadURL('app://./home');
      // globalShortcut.register("CommandOrControl+R", () => {
      //   log.info("CommandOrControl+R is pressed: Shortcut Disabled");
      // });
      // globalShortcut.register("F5", () => {
      //   log.info("F5 is pressed: Shortcut Disabled");
      // });

      // mainWindow.removeMenu();
      // Menu.setApplicationMenu(Menu.buildFromTemplate([]));

    } else {
      const port = process.argv[2];
      await mainWindow.loadURL(`http://localhost:${port}/home`);
      mainWindow.webContents.openDevTools();
    }
  });
}

app.on('window-all-closed', () => {
  app.quit();
});

ipcMain.on('get-version-number', (event) => {

  log.info(`Cybershuttle Local Agent version: ${app.getVersion()}`);

  event.sender.send('version-number', app.getVersion());
});


ipcMain.on('message', async (event, arg) => {
  event.reply('message', `${arg} World!`);
});

ipcMain.on('open-default-browser', (event, url) => {
  shell.openExternal(url);
});

ipcMain.on('ci-logon-logout', (event) => {
  log.warn('logging out');
  session.defaultSession.clearStorageData([], (data) => {
    log.info("Cleared storage data", data);
  });
});

ipcMain.on('ci-logon-login', async (event) => {
  log.warn("Logging in with CI logon");
  var authWindow = createWindow('authWindow', {
    width: 1200,
    height: 800,
    show: false,
    'node-integration': false,
    'web-security': false
  });

  authWindow.loadURL(`${BASE_URL}/auth/redirect_login/cilogon/`);
  authWindow.show();

  authWindow.webContents.on('will-redirect', async (e, url) => {
    if (url.startsWith(`${BASE_URL}/auth/callback/`)) {
      // hitUrl = true
      setTimeout(async () => {
        const data = await getToken(url);

        log.info("Got the token: ", data);
        event.sender.send('ci-logon-success', data);
        writeFile(event, TOKEN_FILE, JSON.stringify(data));
        authWindow.close();
      }, 2000);

      authWindow.hide();
    }
  });
});

let associatedIDToWindow = {};
let counter = 0;

function printKeys(obj) {
  // only show the keys
  log.info(Object.keys(obj));
}

const removeExpWindow = (event, associatedId) => {
  log.info("Removing the window with id: ", associatedId);
  try {
    associatedIDToWindow[associatedId].removeAllListeners('close');
    associatedIDToWindow[associatedId].close();
    delete associatedIDToWindow[associatedId];
  } catch (e) {
    log.error("Window doesn't exist with id: ", associatedId);
  }
};

const createExpWindow = (event, url, associatedId) => {
  log.info("Showing the window with url: ", url, " and associatedId: ", associatedId);

  if (associatedIDToWindow[associatedId]) {
    log.info("Window already exists with id: ", associatedId, " not creating a new one.");
    return;
  }

  counter++;
  let window = createWindow(`jnWindow-${counter}`, {
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      allowDisplayingInsecureContent: true,
      allowRunningInsecureContent: true
    }
  });

  log.info("Window created with id: ", associatedId, " and counter: ", counter);

  associatedIDToWindow[associatedId] = window;
  window.loadURL(url);
  window.show();

  printKeys(associatedIDToWindow);

  window.on('close', () => {
    log.info("Window has been closed: ", associatedId);

    associatedIDToWindow[associatedId].removeAllListeners('close');
    delete associatedIDToWindow[associatedId];

    printKeys(associatedIDToWindow);
    event.sender.send('window-has-been-closed', associatedId);
  });
};

ipcMain.on('show-window', createExpWindow);

ipcMain.on('close-window', (event, associatedId) => {
  try {
    log.info("Closing the window with id: ", associatedId);
    associatedIDToWindow[associatedId].removeAllListeners('close');
    associatedIDToWindow[associatedId].close();
    delete associatedIDToWindow[associatedId];
  } catch (e) {
    log.error("Window doesn't exist with id: ", associatedId);
  }
});

ipcMain.on('is-prod', (event) => {
  event.sender.send('is-prod-reply', isProd);
});

ipcMain.on('get-csagent-path', (event) => {
  const homedir = require('os').homedir();
  const userPath = path.join(homedir, 'csagent');
  event.sender.send('got-csagent-path', userPath);
});

async function getAccessTokenFromRefreshToken(refreshToken) {
  const respForRefresh = await fetch(`${BASE_URL}/auth/get-token-from-refresh-token?refresh_token=${refreshToken}`);

  if (!respForRefresh.ok) {
    // throw new Error("Failed to fetch new access token (refresh token)");
    return null;
  }

  const data = await respForRefresh.json();
  return data;
};

async function checkAccessToken(event, url, options, refreshToken) {
  log.info("Checking if token exists");
  let resp = await fetch(url, options);

  if (!resp.ok) {
    log.warn("Access token is invalid, trying to get a new one");
    const data = await getAccessTokenFromRefreshToken(refreshToken);

    if (!data.access_token || !data.refresh_token) {
      return null;
    }

    writeFile(event, TOKEN_FILE, JSON.stringify(data));
  };

  log.info("Access token is valid");
  return resp;
}

ipcMain.on('ensure-token', (event) => {
  // create an interval to check if the token in TOKEN_FILE exists
  log.info("Starting loop to ensure token exists");
  const interval = setInterval(async () => {
    const data = readFile(TOKEN_FILE);
    if (data) {
      const json = JSON.parse(data);
      const accessToken = json.access_token;
      const refreshToken = json.refresh_token;
      const url = `${BASE_URL}/api/`;
      const options = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      };

      try {
        const resp = await checkAccessToken(event, url, options, refreshToken);
        if (resp) {
          event.sender.send('ensure-token-result', true);
        } else {
          log.error("Could not get access token from refresh token, stopping loop.");
          clearInterval(interval);
          event.sender.send('ensure-token-result', false);
        }
      } catch (err) {
        log.error("Error: ", err);
      }
    } else {
      log.error("Token doesn't exist, not checking");
      return;
    }
  }, 60000); // every minute
});

// ----------------- DOCKER -----------------
var Docker = require('dockerode');
var docker = new Docker(); //defaults to above if env variables are not used

let portsCache = {};

const showWindowWhenReady = (event, id, port) => {
  let url = `http://localhost:${port}/lab`;

  let interval = setInterval(async () => {

    // check if the container is still running
    let container = await docker.getContainer(id);
    let inspected = await container.inspect();
    if (inspected.State.Status !== "running") {
      log.info("Container is not running, removing the window with id: ", id, " and clearing the interval");
      removeExpWindow(event, id);
      clearInterval(interval);
      return;
    } else {
      fetch(url)
        .then((response) => {
          if (response.status === 200) {
            log.info("Got a 200 response from the popup, showing the window");
            createExpWindow(event, url, id);
            clearInterval(interval);
          }
        })
        .catch((error) => {
          log.error("Error: ", error);
        });
    }


  }, 5000);
};

const getContainers = (event) => {
  log.info("Getting running containers");
  docker.listContainers({
    all: true
  }, function (err, containers) {
    // make sure everything in associatedIDToWindow is a container that is running. if not, remove it

    for (let key in associatedIDToWindow) {
      for (let i = 0; i < containers.length; i++) {
        if (containers[i].Id === key) {
          if (containers[i].State !== "running") {
            log.info("Container is not running, removing the window with id: ", key);
            removeExpWindow(event, key);
            break;
          }
        }
      }
    }
    if (!event.sender.isDestroyed()) {
      event.sender.send('got-containers', containers);
    }
  });
};

const pullDockerImage = (event, imageName, callback) => {
  log.info("Pulling docker image: ", imageName);

  const onProgress = function (obj) {
    log.info("Progress: ", obj);
    event.sender.send('docker-pull-progress', obj);
  };

  const onFinished = function (err, output) {
    log.info("Finished: ", output);
    event.sender.send('docker-pull-finished', output);

    if (callback) {
      callback();
    }
  };

  docker.pull(imageName, function (err, stream) {
    docker.modem.followProgress(stream, onFinished, onProgress);
  });
};

const doesImageExist = async (imageName) => {
  const image = docker.getImage(imageName);
  console.log(image);

  try {
    const data = await image.inspect(); // will throw an error if the image doesn't exist
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
};

ipcMain.on('start-container', (event, containerId) => {
  log.info("Starting the container with containerId: ", containerId);

  let container = docker.getContainer(containerId);

  container.start(async function (err, data) {
    log.info("Starting container: ", containerId);

    if (err) {
      event.sender.send('container-started', containerId, err.message);
    } else {
      let error = "";

      try {
        let cont = await container.inspect();
        let port = cont.NetworkSettings.Ports['8888/tcp'][0].HostPort;
        showWindowWhenReady(event, containerId, port);
      } catch (e) {
        log.error("Error: ", e);
        err = e.message;
      }

      event.sender.send('container-started', containerId, error);
    }
  });
});

ipcMain.on('show-window-from-id', (event, containerId) => {
  log.info("Showing the window with containerId: ", containerId);

  let container = docker.getContainer(containerId);
  container.inspect(async function (err, data) {
    if (err) {
      log.error("Error inspecting container: ", err);
    } else {
      let port = data.NetworkSettings.Ports['8888/tcp'][0].HostPort;
      let url = `http://localhost:${port}/lab`;

      // ping the URL first, if it's not up, don't show the window
      fetch(url)
        .then((response) => {
          if (response.status === 200) {
            log.info("Got a 200 response from the popup, showing the window");
            createExpWindow(event, url, containerId);
          }
        })
        .catch((error) => {
          log.error("Error: ", error);
        });
    }
  });
});


ipcMain.on('stop-container', (event, containerId) => {
  log.info("Stopping the container with containerId: ", containerId);

  let container = docker.getContainer(containerId);
  container.stop(function (err, data) {
    console.log("Container stopped: ", containerId);
    event.sender.send('container-stopped', containerId);
  });
});


ipcMain.on('start-notebook', async (event, createOptions) => {
  const imageName = "airavata/airavata-jupyter-lab";
  log.info("Starting the notebook with imageName: ", imageName);
  const startNotebook = () => {
    log.info("Starting the notebook");
    docker.run(imageName, [], null, createOptions, function (err, data, container) {
      if (err) {
        console.error("Error starting the notebook: ", err);
      }
    })
      .on('container', function (container) {
        log.info("Container created: ", container.id);
        let err = "";

        try {
          showWindowWhenReady(event, container.id, createOptions.HostConfig.PortBindings['8888/tcp'][0].HostPort);
        } catch (e) {
          console.log(e);
          err = e;
        }

        event.sender.send('notebook-started', container.id, err);

      });

  };

  try {
    pullDockerImage(event, imageName, startNotebook);
  } catch (e) {
    console.log(e);
  }
});


/*
  1. share binaries w/Eroma to test
  - if docker is not running, show that message on the home page

  - do authentication before showing docker page
    - make this auth in default browser, need create cs:// url for login? with token, parse token
    - https://www.electronjs.org/docs/latest/tutorial/launch-app-from-url-in-another-app
*/

ipcMain.on("get-containers", getContainers);

ipcMain.on('inspect-container', (event, containerId) => {
  log.info("Inspecting the container with containerId: ", containerId);

  let container = docker.getContainer(containerId);
  container.inspect(function (err, data) {
    event.sender.send('container-inspected', data);
  });
});

ipcMain.on('pause-container', (event, containerId) => {
  log.info("Pausing the container with containerId: ", containerId);

  let container = docker.getContainer(containerId);
  container.pause(function (err, data) {
    console.log("Container paused: ", containerId);
    event.sender.send('container-paused', containerId);
  });
});

ipcMain.on('unpause-container', (event, containerId) => {
  log.info("Unpausing the container with containerId: ", containerId);

  let container = docker.getContainer(containerId);
  container.unpause(function (err, data) {
    console.log("Container unpaused: ", containerId);
    event.sender.send('container-unpaused', containerId);
  });
});

ipcMain.on('remove-container', (event, containerId) => {
  log.info("Removing the container with containerId: ", containerId);

  let container = docker.getContainer(containerId);
  container.remove(function (err, data) {
    console.log("Container removed: ", containerId);
    event.sender.send('container-removed', containerId);
  });
});

ipcMain.on('rename-container', (event, containerId, newName) => {
  log.info("Renaming the container with containerId: ", containerId, " to ", newName);

  let container = docker.getContainer(containerId);
  container.rename({ name: newName }, function (err, data) {
    console.log("Container renamed: ", containerId);
    event.sender.send('container-renamed', containerId, newName);
  });
});

ipcMain.on("choose-filepath", async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (!result.canceled) {
    event.sender.send('filepath-chosen', result.filePaths[0]);
  }
});

ipcMain.on('get-container-ports', async (event, containers) => {
  log.info("Getting container ports");

  let ports = {}; // array of objects with containerId and port

  for (let i = 0; i < containers.length; i++) {
    if (portsCache[containers[i].Id]) {
      ports[containers[i].Id] = portsCache[containers[i].Id];
    } else {
      log.warn("Not in cache: ", containers[i].Id, " getting from docker");
      const container = docker.getContainer(containers[i].Id);
      const data = await container.inspect();

      let containerPorts = Object.keys(data.HostConfig.PortBindings);
      let tempMappings = [];
      for (let j = 0; j < containerPorts.length; j++) {
        let tempMapping = {};
        let hostPort = data.HostConfig.PortBindings[containerPorts[j]][0].HostPort;
        tempMapping.containerPort = containerPorts[j];
        tempMapping.hostPort = hostPort;

        tempMappings.push(tempMapping);
      }

      ports[containers[i].Id] = tempMappings;
      portsCache[containers[i].Id] = tempMappings;
    }
  }

  if (!event.sender.isDestroyed()) {
    event.sender.send('got-container-ports', ports);
  }


  /*
    Ports looks like:
    {
      "containerId": [
        {
          "containerPort": "8888/tcp",
          "hostPort": "6080"
        }
      ]
    }
  */
});

ipcMain.on('docker-ping', (event) => {
  log.info("Pinging docker");
  docker.ping(function (err, data) {
    log.info("Docker pinged: ", data);
    if (!event.sender.isDestroyed()) {
      event.sender.send('docker-pinged', data);
    } else {
      log.error("Sender is destroyed");
    }
  });
});

ipcMain.on('get-should-show-runs', (event, allContainers) => {
  // return a list same length as runningContainers with true or false, 
  // true if container is running and is not in associatedIdToWindow

  let shouldShowRuns = {};
  for (let i = 0; i < allContainers.length; i++) {
    if (allContainers[i].State === "running" && !associatedIDToWindow[allContainers[i].Id]) {
      shouldShowRuns[allContainers[i].Id] = true;
    } else {
      shouldShowRuns[allContainers[i].Id] = false;
    }
  }

  if (!event.sender.isDestroyed()) {
    event.sender.send('got-should-show-runs', shouldShowRuns);
  }
});


// ----------------- IMAGES -----------------
ipcMain.on('get-all-images', (event) => {
  log.info("Getting all images");

  docker.listImages(function (err, images) {
    event.sender.send('got-all-images', images);
  });
});


ipcMain.on('inspect-image', (event, imageId) => {
  log.info("Inspecting the image with imageId: ", imageId);

  let image = docker.getImage(imageId);
  image.inspect(function (err, data) {
    event.sender.send('image-inspected', data);
  });
});


// ----------------- TOKEN AUTH -----------------
function createIfNotExists(path) {
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, '', 'utf8');
  }
}

const readFile = (userPath) => {
  log.info("Reading file: ", userPath);
  try {
    if (userPath.startsWith("~")) {
      const homedir = require('os').homedir();
      userPath = path.join(homedir, userPath.substring(1));
    }
    const data = fs.readFileSync(userPath, 'utf8');
    return data;
  } catch (e) {
    return null;
  }
};

ipcMain.on('read-file', (event) => {
  const data = readFile(TOKEN_FILE);
  event.sender.send('file-read', data);
});


const writeFile = async (event, userPath, data) => {
  log.info("Writing to file: ", userPath, " with data: ", data);

  if (userPath.startsWith("~")) {
    const homedir = require('os').homedir();
    // substring until the file at the end to create mkdirs
    const dirPath = userPath.substring(1, userPath.lastIndexOf('/'));
    fs.mkdirSync(path.join(homedir, dirPath), { recursive: true });
    fs.writeFileSync(path.join(homedir, userPath.substring(1)), data);

    log.info("File written");
    event.sender.send('file-written', data);
  } else {
    createIfNotExists(userPath);

    fs.writeFile(userPath, data, (err) => {
      if (err) {
        log.error("Error writing file: ", err);
        event.sender.send('file-written', err);
      } else {
        log.info("File written");
        event.sender.send('file-written', data);
      }
    });
  }
};

ipcMain.on('write-file', writeFile);

/*
GATEWAY PINGING LOGIC
*/

const store = new Store();

const randomString = (length) => {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

  let result = '';
  for (let i = length; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }

  return result;
};

const gateways = [
  {
    "id": "mdcyber",
    "name": "MD Cybershuttle",
    "gateway": "https://cybershuttle.org",
    "loginUrl": `https://iam.scigap.org/auth/realms/testdrive/protocol/openid-connect/auth?response_type=code&client_id=pga&redirect_uri=csagent%3A%2F%2Flogin-callback&scope=openid&state=${randomString(15)}&kc_idp_hint=cilogon&idp_alias=cilogon`
  },
  {
    "id": "aicyber",
    "name": "AI Cybershuttle",
    "gateway": "https://ai.cybershuttleadfasfd.org",
    "loginUrl": `https://google.com`
  }
];

log.info("Gateways: ", gateways);

let CURRENT_GATEWAY = store.get('stored-gateway');

log.info("CURRENT_GATEWAY (before): ", CURRENT_GATEWAY);

if (typeof CURRENT_GATEWAY === "undefined" || CURRENT_GATEWAY === null) {
  CURRENT_GATEWAY = "mdcyber";
}

log.info("CURRENT_GATEWAY (after): ", CURRENT_GATEWAY);


BASE_URL = gateways.find(g => g.id === CURRENT_GATEWAY)?.gateway;

log.info("BASE_URL: ", BASE_URL);

ipcMain.on('get-all-gateways', (event) => {
  log.info("Getting all gateways");
  event.sender.send('got-gateways', gateways);
});

ipcMain.on('get-gateway', (event) => {
  log.info("Getting the gateway");
  event.sender.send('gateway-got', CURRENT_GATEWAY);
});

ipcMain.on('set-gateway', (event, gateway) => {
  log.info("Setting the gateway: ", gateway);
  CURRENT_GATEWAY = gateway;
  BASE_URL = gateways.find(g => g.id === CURRENT_GATEWAY).gateway;
  store.set('stored-gateway', gateway);
  event.sender.send('gateway-set', gateway);
});

