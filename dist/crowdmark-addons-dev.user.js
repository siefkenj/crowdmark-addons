// ==UserScript==
// @name     Crowdmark Addons dev
// @version  1.1
// @description Development mode for Crowdmark Addons. Will load reload the extension from the development server every page refresh.
// @include https://app.crowdmark.com/*
// @grant    none
// ==/UserScript==


"use strict";

function log(...args) {
    console.log("Crowdmark GM:", ...args);
}

log("Dev mode started")

async function main() {
  const resp = await fetch("http://localhost:8123/static/js/main.js")
  const script = await resp.text();
  log("Got Dev script")
  eval(script)
  log("Dev script evaled")
  
}

// Make sure we run once at the start
main.bind({})().catch(e => {
    log("ERROR", e);
});
