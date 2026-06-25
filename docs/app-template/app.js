'use strict';

function readOptions() {
  const raw = window.location.hash ? window.location.hash.slice(1) : window.location.search.slice(1);
  return new URLSearchParams(raw);
}

const opts = readOptions();
const message = opts.get('message');
if (message) document.getElementById('message').textContent = message;
