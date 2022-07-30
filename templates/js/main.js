var logger = (function () {
  let my = {};

  let _appendMsg = function(message, groupEle) {
    var msgEle = document.createElement('div');
    msgEle.textContent = message;
    groupEle.appendChild(msgEle);
  }

  my.error = function(message) {
    var groupEle = document.getElementById("info_circle_text_error");
    _appendMsg(message, groupEle);
    var infoCirc = document.getElementById("info_circle");
    if (!infoCirc.classList.contains("info-circle-error")) {
      infoCirc.classList.add("info-circle-error")
    }
  }

  my.assert = function(condition, message) {
    if (!condition) {
      my.error("(assert) " + message);
    }
  }

  my.warn = function(message) {
    var groupEle = document.getElementById("info_circle_text_warning");
    _appendMsg(message, groupEle);
    var infoCirc = document.getElementById("info_circle");
    if (!infoCirc.classList.contains("info-circle-warning")) {
      infoCirc.classList.add("info-circle-warning")
    }
  }

  my.info = function(message) {
    var groupEle = document.getElementById("info_circle_text_info");
    _appendMsg(message, groupEle);
  }


  my.leech = function() {
    var groupEle = document.getElementById("info_circle_text_leech");
    _appendMsg("", groupEle);
    var infoCirc = document.getElementById("info_circle");
    if (!infoCirc.classList.contains("info-circle-leech")) {
      infoCirc.classList.add("info-circle-leech")
    }
  }

  return my;
}());


// on any javascript error: log it
//window.onerror = function(msg, url, lineNo, columnNo, error) {
window.onerror = function(msg) {
  logger.error("Javascript error: `" + msg + "`");
}

// https://stackoverflow.com/a/55178672
window.onunhandledrejection = function(errorEvent) {
  logger.error("Javascript handler error: `" + errorEvent.reason + "`");
}










/*
 * class to read settings
 */

var settings = (function () {
  let my = {};

  /* defaultOpt=null */
  var _getSetting = function(settingStr, settingObj, defaultOpt) {
    if (typeof settingObj === "undefined" || !(settingStr in settingObj)) {
      logger.warn("Option `" + settingStr + "` is not defined in the options file.");
      if (typeof defaultOpt === "undefined") {
        return null;
      } else {
        return defaultOpt;
      }
    }
    return settingObj[settingStr];
  }

  my.keybind = function(settingStr, defaultOpt) {
    return _getSetting(settingStr, JPMNOpts.settings["keybinds"], defaultOpt);
  }

  my.sentence = function(settingStr, defaultOpt) {
    return _getSetting(settingStr, JPMNOpts.settings["sentence-module"], defaultOpt);
  }

  my.quote = function(settingStr, defaultOpt) {
    return _getSetting(settingStr, JPMNOpts.settings["sentence-module"]["quote-module"], defaultOpt);
  }

  my.general = function(settingStr, defaultOpt) {
    return _getSetting(settingStr, JPMNOpts.settings["general"], defaultOpt);
  }

  return my;

}());




var selectSentence = function(temp) {
  // only chooses the sentence around the bold characters
  var firstMatch = temp.indexOf("<b>");
  var lastMatch = temp.lastIndexOf("</b>");

  // list of valid terminators
  // "removeEnd": is removed if found at the end of a sentence
  var terminators = {
    ".": {removeEnd: true},
    "。": {removeEnd: true},
    "．": {removeEnd: true},
    "︒": {removeEnd: true},

    "!": {removeEnd: false},
    "?": {removeEnd: false},
    "！": {removeEnd: false},
    "？": {removeEnd: false},
    "…": {removeEnd: false},
    "︕": {removeEnd: false},
    "︖": {removeEnd: false},
    "︙": {removeEnd: false},
  }


  if (firstMatch !== -1 && lastMatch !== -1) {
    var beginIdx = firstMatch;
    var endIdx = lastMatch;

    for (; beginIdx >= 0; beginIdx--) {
      if (temp[beginIdx] in terminators) {
        var obj = terminators[temp[beginIdx]];
        beginIdx++;

        //console.log(beginIdx);
        //console.log(temp[beginIdx]);
        break;
      }
    }

    for (; endIdx < temp.length; endIdx++) {
      if (temp[endIdx] in terminators) {
        var obj = terminators[temp[endIdx]];
        if (obj.removeEnd) {
            endIdx--;
        }

        //console.log(endIdx);
        //console.log(temp[endIdx]);
        //console.log(obj.removeEnd);
        break;
      }
    }

    // clamp
    if (beginIdx < 0) {
      beginIdx = 0;
    }
    if (endIdx > temp.length-1) {
      endIdx = temp.length-1;
    }

    temp = temp.substring(beginIdx, endIdx+1)

    // re-adds quotes if necessary
    if (temp[0] !== "「") {
      temp = "「" + temp;
    }
    if (temp[temp.length-1] !== "」") {
      temp = temp + "」";
    }
  }

  return temp;
}


// global variable to set the PA indicator color (as a css class)
var paIndicator = (function () {
  let my = {};
  my.type = null;
  my.className = null;
  my.tooltip = null;

  // TODO
  /* {#
  if ("{{PADoNotTest}}{{PASeparateWordCard}}") {
    // PADoNotTest or PASeparateWordCard -> nothing is tested
    my.type = "none";
  } else if ("{{PASeparateSentenceCard}}{{PATestOnlyWord}}") {
    // either PASeparateSentenceCard or PATestOnlyWord -> only word is tested
    my.type = "word";
  } else if ("{{IsSentenceCard}}") {
    // sentence card but no pitch accent indicators are overridden
    my.type = "sentence";
  } else {
    // regular word card
    my.type = "word";
  }

  my.className = "pa-indicator-color--" + my.type;

  if (my.type === "none") {
    my.tooltip = "Do not test"
  } else if (my.type == "word") {
    my.tooltip = "Word"
  } else { // sentence
    my.tooltip = "Sentence"
  }
  #} */

  return my;
}());


var processQuote = function(sentEle, sent, isAltDisplay) {
  let result = sent;
  let openQuote = null;
  let closeQuote = null;
  let validQuotes = settings.quote("quote-match-strings", [["「", "」"]])

  if (!isAltDisplay && settings.quote("auto-quote-sentence", true)) {
    // this operation seems to be supported in anki!
    let arr = settings.quote("auto-quote-sentence-strings", ["「", "」"])
    logger.assert(Array.isArray(arr), "expected array");
    logger.assert(arr.length === 2, "expected array of len 2");
    [openQuote, closeQuote] = arr;
  }

  // existing quotes override the default quotes, even on alt displays
  for (let quotePair of validQuotes) {
    if ((sent[0] === quotePair[0]) && (sent[sent.length-1] === quotePair[1])) {
      [openQuote, closeQuote] = quotePair;
      result = sent.slice(1, -1);
      break;
    }
  }


  // replaces the element (should only contain text) with the following:
  //
  // <(previous div or span)>
  //  <span> (open quote) </span>
  //  <span> (text) </span>
  //  <span> (close quote) </span>
  // </(previous div or span)>

  let textEle = document.createElement('span');
  textEle.innerHTML = result;

  let openQuoteEle = document.createElement('span');
  openQuoteEle.innerHTML = openQuote;

  let closeQuoteEle = document.createElement('span');
  closeQuoteEle.innerHTML = closeQuote;

  /// {% if note.card_type == "main" %}
    /// {% call IF("PAShowInfo") %}
      if (settings.quote("pa-indicator-color-quotes")) {
        note.colorQuotes = true;
        openQuoteEle.classList.add(paIndicator.className);
        closeQuoteEle.classList.add(paIndicator.className);

        /// {% call IF("IsHoverCard") %}
          var elem = document.querySelector(".expression__hybrid-wrapper");
          if (elem !== null) {
            elem.classList.add("expression__hybrid-wrapper--hover-remove-flag");
          }
        /// {% endcall %}

        // neither hover & click and is either one of TSC / sentence -> removes flag

        /// {% call utils.none_of("IsHoverCard", "IsClickCard") %}
          /// {% call utils.any_of("IsTargetedSentenceCard", "IsSentenceCard") %}
            var svgEle = document.getElementById("flag_box_svg");
            svgEle.style.display = "none";
          /// {% endcall %}
        /// {% endcall %}
      }
    /// {% endcall %}
  /// {% endif %}

  if (settings.quote("left-align-adjust-format")) {
    sentEle.classList.add("left-align-quote-format");
  }

  sentEle.innerText = "";
  sentEle.appendChild(openQuoteEle);
  sentEle.appendChild(textEle);
  sentEle.appendChild(closeQuoteEle);
}


/*
 * processes the sentence (if there is no altdisplay)
 * - removes newlines
 * - finds the shortest possible sentence around the bolded characters
 *   (if specified in the config)
 *
 * isAltDisplay=false
 */
var processSentence = function(sentEle, isAltDisplay, isClozeDeletion) {
  if (!settings.sentence("enabled", true)) {
    return;
  }

  if (typeof isAltDisplay === 'undefined') {
    isAltDisplay = false;
  }

  // removes linebreaks
  var result = sentEle.innerHTML;

  // cloze deletion replacing bold with [...]
  if (typeof isClozeDeletion !== "undefined" && isClozeDeletion) {
    result = result.replace(/<b>.*?<\/b>/g, "<b>[...]</b>");
  }

  if ((!isAltDisplay && settings.sentence("remove-line-breaks", true))
      || isAltDisplay && settings.sentence("remove-line-breaks-on-altdisplay", true)) {
    let noNewlines = result.replace(/<br>/g, "");

    // automatically removes newlines and other html elements
    // https://stackoverflow.com/a/54369605
    let charCount = [...sentEle.innerText.trim()].length;
    let maxCharCount = settings.sentence("remove-line-breaks-until-char-count", 0)

    if ((maxCharCount === 0) || (charCount <= maxCharCount)) {
      result = noNewlines;
    }
  }

  // removes leading and trailing white space (equiv. of strip() in python)
  result = result.trim();

  // selects the smallest containing sentence

  if (!isAltDisplay && settings.sentence("select-smallest-sentence", false)) {
    result = selectSentence(result);
  }

  if (settings.quote("enabled", true)) {
    result = processQuote(sentEle, result, isAltDisplay);
  } else {
    sentEle.innerHTML = result;
  }
}

/*
 * Toggles the display of any given details tag
 */
var toggleDetailsTag = function(ele) {
  if (ele.hasAttribute('open')) {
    ele.removeAttribute('open');
  } else {
    ele.setAttribute("open", "true");
  }
}


function processSentences(isAltDisplay, isClozeDeletion ) {
  var sentences = document.querySelectorAll(".expression--sentence")

  if (sentences !== null) {
    for (var sent of sentences) {
      processSentence(sent, isAltDisplay, isClozeDeletion);
    }
  }
}




//{% block js_functions %}
//{% endblock %}





(async () => {
  if (typeof JPMNOpts === 'undefined') {
    await injectScript(OPTIONS_FILE);
  }

  // sanity check
  if (typeof JPMNOpts === 'undefined') {
    logger.error("JPMNOpts was not defined in the options file. Was there an error?");
  }

  // I'd prefer putting this within individual files for better code separation
  // however, I cannot find a way around the above promises issue,
  // otherwise I could use the .then construct...

  //{#var sentences = document.querySelectorAll(".expression--sentence")
  //var isAltDisplay = false;
  //var isClozeDeletion = false;

  //{% if note.card_type == "main" %}
  //isAltDisplay = {{ IF("AltDisplay") }} true || {{ END("AltDisplay") }} false ? true : false;
  //{% elif note.card_type == "cloze_deletion" %}
  //isAltDisplay = {{ IF("AltDisplay") }} true || {{ END("AltDisplay") }} false ? true : false;
  //isClozeDeletion = true;
  //{% elif note.card_type == "pa_sent" %}
  //{% endif %}

  //if (sentences !== null) {
  //  for (var sent of sentences) {
  //    processSentence(sent, isAltDisplay, isClozeDeletion);
  //  }
  //}
  //#}

  //{% block js_run %}
  //{% endblock %}

})();
