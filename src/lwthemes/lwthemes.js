/*  This Source Code Form is subject to the terms of the Mozilla Public
 *  License, v. 2.0. If a copy of the MPL was not distributed with this
 *  file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const {Constructor: Ccnstr, classes: Cc, interfaces: Ci, utils: Cu} = Components;

function  $(aSelector, aNode) (aNode || document).querySelector(aSelector);
function $$(aSelector, aNode) (aNode || document).querySelectorAll(aSelector);
function jsm(aURL) Cu.import(aURL, {});
function jsBeautify(aJS) js_beautify(aJS, {indent_size: 2, indent_char: " "});

const {LightweightThemeManager} = jsm("resource://gre/modules/LightweightThemeManager.jsm");
var {usedThemes: _themes, currentTheme: _currentTheme} = LightweightThemeManager;

const {AddonManager} = jsm("resource://gre/modules/AddonManager.jsm");
const {Services} = jsm("resource://gre/modules/Services.jsm");

var _chromeWin = Services.wm.getMostRecentWindow("navigator:browser") ||
                 Services.wm.getMostRecentWindow("mail:3pane");

const AMO_URL = "https://addons.mozilla.org";

const THUNDERBIRD = Application.id === "{3550f703-e582-4d05-9a08-453d09bdfdc6}";
const SEAMONKEY = Application.id === "{92650c4d-4b8e-4d2a-b7eb-24ecf4f6b63a}";

const PREF_ROOT = "extensions.lwthemes-manager@loucypher.";
const prefs = Services.prefs.getBranch(PREF_ROOT);

const _strings = Services.strings.createBundle("chrome://lwthemes/locale/lwthemes.properties");

var _devMode = prefs.getBoolPref("devmode");
var _compact = prefs.getBoolPref("compactView");

/**
 *  Set document language and direction based on browser language
 */
$("html").lang = Services.urlFormatter.formatURL("%LOCALE%"); // The safest way
//console.log($("html").lang);
switch ($("html").lang) {
  case "ar":    // Arabic
  case "he":    // Hebrew
  case "fa":    // Farsi
    $("html").classList.add("rtl");  // Right to left
}

var _skin = {
  light: $("link[title=Light]").sheet,  // Light
  dark: $("link[title=Dark]").sheet,    // Dark

  prefValue: prefs.getBoolPref("darkTheme"),

  get selected() {
    if (this.prefValue)
      return "Dark";
    else
      return "Light";
  },

  set selected(aBoolean) {
    this.prefValue = aBoolean;
  },

  toggleRadio: function toggleRadio() {
    $("#pref-skin-light").checked = !this.prefValue;
    $("#pref-skin-dark").checked = this.prefValue;
  },

  toggle: function toggleSkin() {
    this.dark.disabled = this.light.disabled;
    this.light.disabled = !this.light.disabled;
    this.selected = !this.dark.disabled;
    this.toggleRadio();
    prefs.setBoolPref("darkTheme", this.prefValue);
    //console.log(_skin.selected);
  },

  applyFromPref: function applyFromPref() {
    this.dark.disabled = !this.prefValue;
    this.light.disabled = this.prefValue;
    this.toggleRadio();
    //console.log(_skin.selected);
  },

  toString: function toString() {
    return this.selected;
  }
};

function addonInstallOrEnable(aNode) {
  AddonManager.getAddonByID(aNode.dataset.addonId, function(aAddon) {
    if (aAddon && aAddon.userDisabled) {
      aAddon.userDisabled = false;
      if (aNode.dataset.needRestart == "true") {
        aNode.classList.add("hidden");
        aNode.nextSibling.nextSibling.classList.remove("hidden");
      }
      else
        location.reload();
      return;
    }
    var amoId = aNode.dataset.amoId;
    location.assign(AMO_URL + "/downloads/latest/" + amoId +
                    "/addon-" + amoId + "-latest.xpi?src=external-addon-472283");
    aNode.classList.add("hidden");
    aNode.nextSibling.nextSibling.classList.remove("hidden");
  });
}

var _personas = {
  ID: "personas@christopher.beard",
  URL: AMO_URL + "/addon/personas-plus/",
  EDITOR: "chrome://personas/content/customPersonaEditor.xul",
  addon: null,
  status: null,
  custom: null,

  install: function installPersonas() {
    location.assign(AMO_URL + "/firefox/downloads/latest/10900/" +
                    "addon-10900-latest.xpi?src=external-addon-472283");
  },

  enable: function enablePersonas(aNode) {
    addonInstallOrEnable(aNode);
  },

  disable: function enablePersonas(aNode) {
    this.addon.userDisabled = true;
    aNode.parentNode.classList.add("hidden");
    aNode.parentNode.previousSibling.previousSibling.classList.remove("hidden");
  },

  edit: function editPersona() {
    var container, openTab;

    if (THUNDERBIRD) {  // Thunderbird
      var tabmail = _chromeWin.document.getElementById("tabmail");
      container = tabmail.tabContainer;
      openTab = function openTab(aURL) {
        _chromeWin.openContentTab(aURL, "tab", "^(https?|chrome):");
      }
    }
    else {
      var gBrowser = _chromeWin.gBrowser;
      container = gBrowser.tabContainer;
      openTab = function openTab(aURL) {
        _chromeWin.switchToTabHavingURI(aURL, true);
      }
    }

    //console.log(container.localName);
    container.addEventListener("TabClose", function(aEvent) {
      //console.log(aEvent.currentTarget.localName);
      var browser = gBrowser.getBrowserForTab(aEvent.target) || tabmail.selectedTab.browser;
      //console.log(browser.currentURI.spec);
      if (browser.currentURI.spec === _personas.EDITOR &&
          LightweightThemeManager.currentTheme.id === "1") {

        aEvent.currentTarget.removeEventListener(aEvent.type, arguments.callee, true);

        var themeBox = $(".persona");
        if (!themeBox) {
          location.reload();
          return;
        }

        _personas.custom = LightweightThemeManager.currentTheme;
        _currentTheme = _personas.custom; // Update _currentTheme
        applyThemeToNode($(".search"));

        themeBox.dataset.browsertheme = JSON.stringify(_currentTheme);
        var image = $(".image", themeBox);
        image.src = _currentTheme.headerURL;
        image.removeAttribute("style");
        image.alt = $(".theme-title a", themeBox).textContent = _currentTheme.name;
        if (_compact)
          image.title = _currentTheme.name;
        image.style.color = _currentTheme.textcolor;
        image.style.backgroundColor = _currentTheme.accentcolor;
        if (!themeBox.classList.contains("current")) {
          $(".current").classList.remove("current");
          themeBox.classList.add("current");
        }
      }
    }, true);
    openTab(this.EDITOR);
  },

  init: function checkForPersonas() {
    if (SEAMONKEY) {
      this.status = "incompatible";
      return;
    }

    for (var i in _themes)
      if (_themes[i].id === "1")
        this.custom = _themes[i];

    AddonManager.getAddonByID(this.ID, function(personas) {
      if (personas) {
        _personas.addon = personas;

        if (personas.isActive) {
          _personas.status = "enabled";
          $("html").classList.add("personas");
          $(".no-themes .personas-enabled").classList.remove("hidden");
          $(".menu .personas-enabled").classList.remove("hidden");
        }
        else {
          _personas.status = "disabled";
          $(".no-themes .personas-disabled").classList.remove("hidden");
          $(".menu .personas-disabled").classList.remove("hidden");
        }
        var editLabel = getEntityFromDTD("chrome://personas/locale/personas.dtd",
                                         "contextEdit.label", "Edit");
        //console.log(editLabel);
        //console.log($("#template .edit"));
        $("#template .edit").textContent = editLabel;
      }
      else {
        _personas.status = "not installed";
        $(".no-themes .personas-not-installed").classList.remove("hidden");
        $(".menu .personas-not-installed").classList.remove("hidden");
      }
    })
  }
}

/**
 *  Backup and restore installed themes
 */
var BackupUtils = {
  lastDirectory: {
  //http://hg.mozilla.org/mozilla-central/file/5eb1c89fc2bc/browser/base/content/browser.js#l1752
    PREF: "lastDir",
    _lastDir: null,

    get path() {
      if (!this._lastDir || !this._lastDir.exists()) {
        try {
          this._lastDir = prefs.getComplexValue(this.PREF, Ci.nsIFile);
          if (!this._lastDir.exists())
            this._lastDir = null;
        }
        catch (ex) {}
      }
      return this._lastDir;
    },

    set path(val) {
      try {
        if (!val || !val.isDirectory())
          return;
      }
      catch (ex) {
        return;
      }
      this._lastDir = val.clone();

      // Don't save the last open directory pref inside the Private Browsing mode
      if (!privateWindow())
        prefs.setComplexValue(this.PREF, Ci.nsIFile, this._lastDir);
    },

    reset: function() {
      this._lastDir = null;
    }
  },

  setCustomPersonasPref: function backupUtils_setCustomPersonasPref(aTheme) {
    var str = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
    str.data = JSON.stringify(aTheme);
    Services.prefs.setComplexValue("extensions.personas.custom", Ci.nsISupportsString, str);
  },

  leadingZero: function backupUtils_leadingZero(aNum) {
    var num = "0";
    if (aNum.toString().length == 1)
      num += aNum;
    else
      num = aNum;
    return num;
  },

  getTimeString: function backupUtils_getTimeString() {
    var DATE = new Date();
    var strYear = DATE.getFullYear().toString();
    var strMonth = this.leadingZero(DATE.getMonth() + 1);
    var strDate = this.leadingZero(DATE.getDate());
    var strHour = this.leadingZero(DATE.getHours());
    var strMin = this.leadingZero(DATE.getMinutes());
    return strYear + "-" + strMonth + "-" + strDate + "-" + strHour + strMin;
  },

  readFile: function backupUtils_readFile(aFile) {
    var data = "";
    var fstream = Cc["@mozilla.org/network/file-input-stream;1"].
                  createInstance(Ci.nsIFileInputStream);
    fstream.init(aFile, -1, 0, 0);
    var charset = "UTF-8";
    const replacementChar = Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER;
    var is = Cc["@mozilla.org/intl/converter-input-stream;1"].
             createInstance(Ci.nsIConverterInputStream);
    is.init(fstream, charset, 1024, replacementChar);
    var str = {};
    while (is.readString(4096, str) != 0)
      data += str.value;

    is.close();
    return data;
  },

  filePicker: function backupUtils_filePicker(aCommand, aNode) {
    function formatFileName(aString) aString.replace(/(\\|\:|\*|\?|\"|\<|\>|\|)/g, "")
                                            .replace(/(\/|\s)/g, "-")
                                            .toLowerCase();

    var callback, extra;
    var appname = formatFileName(Application.name);
    var channel;
    try {
      channel = formatFileName(Services.prefs.getCharPref("app.update.channel"));
    }
    catch (ex) {
      channel = "";
    }
    channel = (channel === "release" || channel === "default") ? "" : (channel + "-");

    var fp = Cc["@mozilla.org/filepicker;1"].createInstance(Ci.nsIFilePicker);
    fp.displayDirectory = this.lastDirectory.path;
    fp.appendFilter("JSON", "*.JSON");

    if (aCommand === "backup") {
      fp.init(window, getString("themesBackupPickerTitle"), Ci.nsIFilePicker.modeSave);
      fp.defaultString = "themes-" + appname + "-" + (channel ? channel : "") +
                         this.getTimeString() + ".json";
      callback = this.backupThemes;
    }

    else if (aCommand === "restore") {
      fp.init(window, getString("themesRestorePickerTitle"), Ci.nsIFilePicker.modeOpen);
      fp.appendFilters(Ci.nsIFilePicker.filterAll);
      callback = this.restoreThemes;
    }

    else if (aCommand === "save") {
      var themeBox = getThemeBox(aNode);
      var theme = LightweightThemeManager.parseTheme(themeBox.dataset.browsertheme);
      if (!theme)
        theme = JSON.parse(themeBox.dataset.browsertheme);  // Custom Personas

      var filename = formatFileName(theme.name);
      fp.init(window, getString("themeSavePickerTitle"), Ci.nsIFilePicker.modeSave);
      if (theme.id === "1") {
        var prefix = getEntityFromDTD("chrome://personas/locale/personas.dtd",
                                      "customPersona.label", "Custom Persona");
        prefix = formatFileName(prefix);
        filename = prefix === filename ? filename : prefix + "-" + filename;
        fp.defaultString = filename + ".theme.json";  // Custom Personas
      }
      else
        fp.defaultString = filename + ".theme.json";
      callback = this.backupThemes;
    }

    else
      return;

    extra = aNode ? aNode : null;
    try {
      callback(fp.show(), fp.file, extra);
    }
    catch (ex) {
      fp.open(function(result) {
        callback(result, fp.file, extra);
      });
    }
  },

  backupThemes: function backupUtils_backupThemes(aResult, aFile, aNode) {
    var strData, theme;
    if (aNode)
      strData = jsBeautify(getThemeBox(aNode).dataset.browsertheme);
    else
      strData = JSON.stringify(_themes);

    if (aResult == Ci.nsIFilePicker.returnOK || aResult == Ci.nsIFilePicker.returnReplace) {
      BackupUtils.lastDirectory.path = aFile.parent.QueryInterface(Ci.nsIFile);

      var ostream = Cc["@mozilla.org/network/file-output-stream;1"].
                    createInstance(Ci.nsIFileOutputStream);
      ostream.init(aFile, 0x02 | 0x08 | 0x20, 0664, 0);

      var charset = "UTF-8";
      var os = Cc["@mozilla.org/intl/converter-output-stream;1"].
               createInstance(Ci.nsIConverterOutputStream);
      os.init(ostream, charset, 4096, 0x0000);
      os.writeString(strData);
      os.close();
    }
  },

  restoreThemes: function backupUtils_restoreThemes(aResult, aFile) {
    if (aResult == Ci.nsIFilePicker.returnOK) {
      if (aFile && aFile.exists()) {
        BackupUtils.lastDirectory.path = aFile.parent.QueryInterface(Ci.nsIFile);
        var data = BackupUtils.readFile(aFile);
        var obj, theme;
        try {
          obj = JSON.parse(data);
          if (obj.length)
            theme = LightweightThemeManager.parseTheme(JSON.stringify(obj[0]));
          else if ("id" in obj && obj.id === "1") // Custom Personas
            theme = obj;
          else
            theme = LightweightThemeManager.parseTheme(data);
          if (!theme) {
            alert(getString("themesRestoreInvalidText"));
            return;
          }
        } catch (ex) {
          alert(getString("themesRestoreInvalidText"));
          return;
        }

        if (!obj.length) {
          // Install individual theme from a file
          LightweightThemeManager.themeChanged(theme);
          if (theme.id === "1") {
            BackupUtils.setCustomPersonasPref(theme);
            _personas.custom = theme;
          }

          var exists = $("[data-theme-id='" + theme.id + "']");
          if (exists)
            exists.parentNode.removeChild(exists);

          // Create new theme box
          var themeBox = addThemeBox(theme);
          themeBox.classList.add("current");

          if ($(".current"))
            $(".current").classList.remove("current");

          var article = $(".theme:not(#template)") || $(".no-themes");
          article.parentNode.insertBefore(themeBox, article)
          applyThemeToNode($(".search"), theme);
          if ($(".nothemes"))
            $(".nothemes").classList.remove("nothemes");

          _themes = LightweightThemeManager.usedThemes;
          _currentTheme = LightweightThemeManager.currentTheme;
          _chromeWin.LightWeightThemeWebInstaller._removePreviousNotifications();
          if (SEAMONKEY)
            _chromeWin.reloadThemes();
          return;
        }

        if (_themes.length) {
          // Show warning
          var warning = getString("themesRestoreWarningTitle");
          var counter = warning + "\n\n" + getString("themesRestoreWarningCounter",
                                                     _themes.length, obj.length);
          var message = counter + "\n\n" + getString("themesRestoreWarningText");
          if (!confirm(message))
            return;

          // Removed all installed themes
          Services.prefs.setCharPref("lightweightThemes.usedThemes", "");
        }

        while (obj.length) {
          theme = obj.pop();
          LightweightThemeManager.themeChanged(theme);  // Install all themes from file
          _chromeWin.LightWeightThemeWebInstaller._removePreviousNotifications();
          if (theme.id === "1") { // Custom Personas
            BackupUtils.setCustomPersonasPref(theme);
            _personas.custom = theme;
          }
        }

        if (SEAMONKEY)
          _chromeWin.reloadThemes();
        LightweightThemeManager.setLocalTheme();
        location.reload();
      }
    }
  }
}

function getString(aString, aArgs){ //get localised message
  if (aArgs) {
    aArgs = Array.prototype.slice.call(arguments, 1);
    return _strings.formatStringFromName(aString, aArgs, aArgs.length);
  }
  else
    return _strings.GetStringFromName(aString);
}

function privateWindow() {
  try {
    const {PrivateBrowsingUtils} = Cu.import("resource://gre/modules/PrivateBrowsingUtils.jsm", {});
    return PrivateBrowsingUtils.isWindowPrivate(_chromeWin);
  } catch (ex) {
    return false;
  }
}

function setPrivateWindow() {
  $("html").classList.add("privatebrowsing");
  AddonManager.getAddonByID("pbm-personas@dactyl.googlecode.com", function(aAddon) {
    var name = "Private Browsing Personas";
    var string = "needToInstallExtension";
    var label = "installExtension";
    if (aAddon) {
      if (aAddon.userDisabled) {
        string = "needToEnableExtension"
        label = "enableExtension";
      }
      else {
        $("html").classList.remove("privatebrowsing");
        return;
      }
    }
    $$(".private-browsing p")[1].textContent += getString(string, name);
    $(".private-browsing a").textContent = getString(label, name);
  })
}

function sort(aArray) {
  aArray.sort(function(a, b) {
    a = a.name.toLowerCase();
    b = b.name.toLowerCase();
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  })
}

function getThemeBox(aNode) {
  try {
    while (aNode && !aNode.hasAttribute("data-browsertheme"))
      aNode = aNode.parentNode;
    return aNode;
  } catch (ex) {
    return null;
  }
}

function getEntityFromDTD(aChromeURL, aEntity, aDefVal) {
  const XMLHttpRequest = Ccnstr("@mozilla.org/xmlextras/xmlhttprequest;1", "nsIXMLHttpRequest");
  var xhr = new XMLHttpRequest();
  xhr.open("GET", aChromeURL, false);
  xhr.send(null);
  try {
    return xhr.responseText.match("ENTITY.*" + aEntity + "[^\>]+").toString()
                           .match(/\".*/).toString().replace(/\"/g, "");
  } catch (ex) {
    return aDefVal;
  }
}

function applyThemeToNode(aNode, aTheme) {
  var theme = aTheme ? aTheme : _currentTheme;
  aNode.style.color = theme.textcolor;
  aNode.style.backgroundColor = theme.accentcolor;
  aNode.style.backgroundImage = "url(" + theme.headerURL + ")";
  aNode.style.backgroundPosition = "right center";
}

function showTotalThemes(aNumber) {
  var text = getString("themesTotal", aNumber);
  console.log(text);
  Services.console.logStringMessage(document.title + "\n" + text);
  _chromeWin.XULBrowserWindow && _chromeWin.XULBrowserWindow.setOverLink(text);
}

/**
 *  Set a theme
 *  @param aNode Node that triggers the action
 *  @param aAction "wear"     Wear a theme
 *                 "stop"     Stop wearing a theme
 *                 "dump"     Uninstall a theme
 *                 "preview"  Preview a theme
 *                 "reset"    Reset preview
 */
function setTheme(aNode, aAction) {
  var themeBox = getThemeBox(aNode);
  var theme = LightweightThemeManager.parseTheme(themeBox.dataset.browsertheme);
  if (!theme)
    theme = JSON.parse(themeBox.dataset.browsertheme);

  switch (aAction) {
    case "preview":
      LightweightThemeManager.previewTheme(theme);
      applyThemeToNode($(".search"), theme);
      return;

    case "reset":
      LightweightThemeManager.resetPreview();
      if (_currentTheme)
        applyThemeToNode($(".search"), _currentTheme);
      else
        $(".search").removeAttribute("style");
      return;

    case "stop":
      LightweightThemeManager.setLocalTheme();
      themeBox.classList.remove("current");
      $(".search").removeAttribute("style");
      _currentTheme = null;
      break;

    case "dump":
      var remove = confirm(getString("themeRemoveConfirmation", theme.name));
      if (!remove)
        return;

      LightweightThemeManager.forgetUsedTheme(theme.id);
      if (theme.id === "1") { // Custom Personas
        Services.prefs.clearUserPref("extensions.personas.custom");
        _personas.custom = null;
      }

      if (themeBox.classList.contains("current")) {
        $(".search").removeAttribute("style");
        _currentTheme = null;
      }
      themeBox.parentNode.removeChild(themeBox);
      console.log(getString("themeRemoved", theme.name));
      _themes = LightweightThemeManager.usedThemes;
      //console.log(_themes.length);
      if (_themes.length)
        showTotalThemes(_themes.length);
      else
        $("html").classList.add("nothemes");
      break;

    default:
      LightweightThemeManager.setLocalTheme(theme);
      if ($(".current"))
        $(".current").classList.remove("current");
      themeBox.classList.add("current");
      _currentTheme = theme;
      applyThemeToNode($(".search"), _currentTheme);
      _themes = LightweightThemeManager.usedThemes;
      _chromeWin.LightWeightThemeWebInstaller._removePreviousNotifications();
  }
}

/**
 *  Get theme home page. Use AMO or getpersonas.com URL if no home page.
 */
function getThemeURL(aTheme) {
  const { id: id, homepageURL: homepageURL, updateURL: updateURL } = aTheme;

  if (homepageURL)
    return homepageURL;

  if (id === "1")
    return _personas.URL;

  if (updateURL) {
    if (updateURL.match(/getpersonas.com/) || updateURL.match(/\?src\=gp$/))
      return AMO_URL + "/persona/" + id;
    if (updateURL.match(/addons.mozilla.org/))
      return AMO_URL + "/addon/" + id;
  }

  return null;
}

function updateOldPersona(aNode) {
  var update = confirm(getString("themeUpdateOld"));
  if (!update)
    return;

  var themeBox = getThemeBox(aNode);
  themeBox.classList.add("updating");
  var theme = LightweightThemeManager.parseTheme(themeBox.dataset.browsertheme);
  if (!theme)
    theme = JSON.parse(themeBox.dataset.browsertheme);

  const XMLHttpRequest = Ccnstr("@mozilla.org/xmlextras/xmlhttprequest;1", "nsIXMLHttpRequest");
  var xhr = new XMLHttpRequest();
  xhr.open("GET", theme.updateURL, true);
  xhr.onload = function() {
    if (xhr.status >= 400) {
      Cu.reportError(xhr.statusText);
      themeBox.classList.remove("updating");
      return;
    }
    //console.log(jsBeautify(xhr.responseText));
    var newTheme = LightweightThemeManager.parseTheme(xhr.responseText, theme.updateURL);
    if (!newTheme || newTheme.id != theme.id) {
      console.log("quitting");
      themeBox.classList.remove("updating");
      return;
    }
    newTheme.description = theme.description;
    LightweightThemeManager.themeChanged(newTheme);
    if (_currentTheme) {
      if (_currentTheme.id != theme.id)
        LightweightThemeManager.setLocalTheme(_currentTheme);
    }
    else
      LightweightThemeManager.setLocalTheme();

    //console.log(theme.updateURL);
    var newBox = themeBox.parentNode.insertBefore(addThemeBox(newTheme), themeBox);
    themeBox.parentNode.removeChild(themeBox);
    _themes = LightweightThemeManager.usedThemes;
  }
  onerror = function() {
    themeBox.classList.remove("updating");
    Cu.reportError(xhr.statusText);
  }
  onabort = function() {
    console.log("aborted");
    themeBox.classList.remove("updating");
  }
  xhr.send(null);
}

// https://developer.mozilla.org/en-US/docs/XUL/School_tutorial/DOM_Building_and_HTML_Insertion#Safely_Using_Remote_HTML
/**
 * Safely parse an HTML fragment, removing any executable
 * JavaScript, and return a document fragment.
 *
 * @param {string} aHtmlString The HTML fragment to parse.
 */
function parseHTML(aHtmlString) {
  var parser = Cc["@mozilla.org/parserutils;1"].getService(Ci.nsIParserUtils);
  return parser.parseFragment(aHtmlString, 0, false, null, document.documentElement);
}

/**
 *  Generate boxes for installed themes
 */
function addThemeBox(aTheme) {
  const {
    id: id, name: name, author: author, description: description,
    previewURL: previewURL, headerURL: headerURL, updateURL: updateURL
  } = aTheme;

  var themeData = JSON.stringify(aTheme);

  var box = $("#template").cloneNode(true); // Clone from template
  box.removeAttribute("id");
  box.dataset.themeId = id;
  box.dataset.browsertheme = themeData;
  if (_currentTheme && aTheme.id === _currentTheme.id)
    box.classList.add("current");

  if (id === "1") {
    box.classList.add("persona");
    $(".theme-author", box).textContent = getEntityFromDTD("chrome://personas/locale/personas.dtd",
                                                           "customPersona.label", "Custom Persona");
  }

  if (/^solid\-color/.test(aTheme.id)) {
    $(".preview", box).classList.add("solid-color");
    $(".image", box).src = "preview.png";
  }
  else if (previewURL)
    $(".image", box).src = previewURL.replace(/\?\d+/, "");
  else
    $(".image", box).src = headerURL.replace(/\?\d+/, "");

  $(".image", box).style.backgroundColor = aTheme.accentcolor;
  $(".image", box).style.color = aTheme.textcolor;
  $(".image", box).alt = name;
  $(".image", box).title = _compact ? name : $(".preview a", box).title;

  var themeURL = getThemeURL(aTheme);
  if (themeURL) {
    $(".theme-title a", box).href = $("header a", box).href = themeURL;
    $(".theme-title a", box).textContent = name;
    if (updateURL && updateURL.match(/getpersonas.com/))
      box.classList.add("old");
  }
  else {
    $(".theme-title", box).textContent = name;
    $(".theme .preview a", box).removeAttribute("title");
  }

  if (author)
    $(".theme-author", box).textContent += author;

  if (description) {
    $(".theme-description", box).appendChild(parseHTML(description));
  }

  return box;
}

function openAddonsManager(aNode) {
  var addonId;
  var themeBox = getThemeBox(aNode);
  if (themeBox) {
    var theme = LightweightThemeManager.parseTheme(themeBox.dataset.browsertheme);
    if (!theme)
      theme = JSON.parse(themeBox.dataset.browsertheme);
    addonId = theme.id + "@personas.mozilla.org";
  }
  else
    addonId = aNode.dataset.addonId;

  var view = "addons://detail/" + encodeURIComponent(addonId);

  if ("toEM" in _chromeWin) {
    _chromeWin.toEM(view);
  } else if ("openAddonsMgr" in _chromeWin) {
    _chromeWin.openAddonsMgr(view);
  } else {
    _chromeWin.BrowserOpenAddonsMgr(view);
  }
}

function inspect(aNode) {
  var themeBox = getThemeBox(aNode);
  var theme = LightweightThemeManager.parseTheme(themeBox.dataset.browsertheme);
  if (!theme)
    theme = JSON.parse(themeBox.dataset.browsertheme);
  inspectObject(theme);
}

function toggleViewer() {
  $(".viewer").classList.toggle("open");
}

function jsonView(aNode) {
  var themeBox = getThemeBox(aNode);
  var json = jsBeautify(themeBox.dataset.browsertheme);
  var viewOption = prefs.getIntPref("jsonview");
  if (viewOption === 1 && "Scratchpad" in _chromeWin) {
    _chromeWin.Scratchpad.ScratchpadManager.openScratchpad({text: json});
    return;
  }

  $(".viewer textarea").value = json;
  $(".viewer").classList.add("open");
  $(".viewer textarea").focus();
}

function toggleDevMode(aNode) {
  _devMode = aNode.checked;
  prefs.setBoolPref("devmode", _devMode);
  if (_devMode)
    $("html").classList.add("devmode");
  else
    $("html").classList.remove("devmode");
}

function toggleCompactView(aNode) {
  _compact = aNode.checked;
  prefs.setBoolPref("compactView", _compact);
  if (_compact)
    $("html").classList.add("compact");
  else
    $("html").classList.remove("compact");

  var previews = $$(".theme .image");
  for (var i = 0; i < previews.length; i++)
    previews[i].title = _compact ? previews[i].alt : previews[i].parentNode.title;
}

function toggleMenu() {
  $(".menu-button").classList.toggle("focus");
  $(".menu").classList.toggle("open");
}

function closeMenu() {
  $(".menu").classList.remove("open");
  $(".menu-button").classList.remove("focus");
}

function fixedHeader() {
  $(".header").classList.add("fixed");
}

function unfixedHeader() {
  $(".header").classList.remove("fixed");
}

function checkForSearchEngine() {
  var browserSearchService = Cc["@mozilla.org/browser/search-service;1"]
                             .getService(Ci.nsIBrowserSearchService);
  var engine = browserSearchService.getEngineByName("Mozilla Themes");
  if (engine)
    return true;
  return false;
}

function installSearchEngine(aNode) {
  if (checkForSearchEngine())
    return;

  var searchCallback = {
    onSuccess: function(aEngine) {
      if (aEngine) {
        console.log(getString("searchEngineInstallOK"));
        aNode.classList.add("hidden");
      }
    },
    onError: function(aErrorCode) {
      Cu.reportError(aErrorCode);
    }
  }

  var browserSearchService = Cc["@mozilla.org/browser/search-service;1"].
                             getService(Ci.nsIBrowserSearchService);
  var engineURL = "https://raw.github.com/LouCypher/lwthemes/master/search-plugin.xml";
  var iconURL = "chrome://lwthemes/skin/icon16.png";
  browserSearchService.addEngine(engineURL, Ci.nsISearchEngine.DATA_XML, iconURL, true,
                                 searchCallback);
}

function focusSearch() {
  closeMenu();
  if (pageYOffset >= 50)
    fixedHeader();
  $(".search-input").focus();
}

function setFooterContent() {
  /*
  var gifts = ["beer", "coffee", "donut", "drink", "hot dog", "Ferrari"];
  var num = parseInt(Math.random() * gifts.length);
  $(".paypal a").textContent = "Buy me a " + gifts[num];
  $(".paypal a").href = "https://www.paypal.com/cgi-bin/webscr" +
                        "?cmd=_s-xclick&hosted_button_id=WDQL25BGYS3C2" +
                        "&amount=3%2e14&currency_code=USD" +
                        "&item_name=Light%20Weight%20Themes%20Manager";
*/
  AddonManager.getAddonByID("lwthemes-manager@loucypher", function(aAddon) {
    $(".lwthemes-name").textContent = aAddon.name;
    $(".lwthemes-creator").textContent = aAddon.creator;
    if (aAddon.translators.length === 1) {
      $(".translator").classList.remove("hidden");
      $(".translator a").textContent = aAddon.translators;
    }
  })
}

function onclick(aEvent) {
  //console.log(aEvent.target);
  var classList = aEvent.target.classList;
  if (!(classList.contains("menu") || classList.contains("menuitem") ||
        classList.contains("menu-button"))) {
    //aEvent.currentTarget.removeEventListener(aEvent.type, arguments.callee, true);
    closeMenu();
  }
}

function onkeypress(aEvent) {
  //console.log(aEvent.keyCode);
  if (aEvent.keyCode === aEvent.DOM_VK_ESCAPE) {  // Esc key
    closeMenu();
    unfixedHeader();
    $(".viewer").classList.remove("open");
    //inspectObject(aEvent);
  }

  // Allow reload page by pressing F5 on Thunderbird
  if (THUNDERBIRD && aEvent.keyCode === aEvent.DOM_VK_F5)
    location.reload();
}

function formSubmit(aEvent) {
  var query = aEvent.target.q.value;
  if (query === "") {
    aEvent.preventDefault();
    location.assign(AMO_URL + "/themes/");
  }
  else if (query.match(/^by:\w+/i)) {
    aEvent.preventDefault();
    var username = query.replace(/^by:/i, "").trim();
    if (username.match(/\//)) {
      var category = username.replace(/\s/g, "-").match(/\/.*/);
      username = username.match(/\w+/);
    }
    if (category)
      location.assign(AMO_URL + "/user/" + username + "/themes" + category);
    else
      location.assign(AMO_URL + "/user/" + username + "/themes");
  }
}

function onload() {
  _personas.init();
  _skin.applyFromPref();
  setFooterContent();

  if (privateWindow())
    setPrivateWindow();

  if (_compact) {
    $("#pref-compact").checked = true;
    $("html").classList.add("compact");
  }

  if (_devMode) {
    $("#pref-devmode").checked = true;
    $("html").classList.add("devmode");
  }

  if (typeof inspectObject === "function") {
    $(".inspect").classList.remove("hidden");
    $(".inspect").textContent = getEntityFromDTD("chrome://inspector/locale/",
                                                 "btnInspect.label", "Inspect");
  }

  if (!_themes.length) {                        // If no installed themes
    $("html").classList.add("nothemes");        // show 'No themes installed"
    return;
  }

  sort(_themes);  // Sort by name

  // Generate boxes for installed themes
  for (var i in _themes)
    $("section").insertBefore(addThemeBox(_themes[i]), $(".no-themes"));

  // Move current theme to top
  if (_currentTheme) {
    $(".current").parentNode.insertBefore($(".current"), $(".theme:not(#template)"));
    applyThemeToNode($(".search"));
  }

  _themes = LightweightThemeManager.usedThemes; // Restore sort order

  if (checkForSearchEngine() || THUNDERBIRD)
    $(".search-engine").classList.add("hidden");

  showTotalThemes(_themes.length);
}

function onunload() {
  Services.strings.flushBundles();
  window.removeEventListener("keypress", onkeypress);
  window.removeEventListener("click", onclick);
  window.removeEventListener("load", onload);
  window.removeEventListener("unload", onunload);
}

window.addEventListener("load", onload);
window.addEventListener("unload", onunload);
window.addEventListener("click", onclick);
window.addEventListener("keypress", onkeypress);
