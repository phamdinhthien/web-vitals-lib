var M, h = function() {
  return window.performance && performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
}, E = function(e) {
  if (document.readyState === "loading") return "loading";
  var t = h();
  if (t) {
    if (e < t.domInteractive) return "loading";
    if (t.domContentLoadedEventStart === 0 || e < t.domContentLoadedEventStart) return "dom-interactive";
    if (t.domComplete === 0 || e < t.domComplete) return "dom-content-loaded";
  }
  return "complete";
}, X = function(e) {
  var t = e.nodeName;
  return e.nodeType === 1 ? t.toLowerCase() : t.toUpperCase().replace(/^#/, "");
}, O = function(e, t) {
  var i = "";
  try {
    for (; e && e.nodeType !== 9; ) {
      var n = e, r = n.id ? "#" + n.id : X(n) + (n.classList && n.classList.value && n.classList.value.trim() && n.classList.value.trim().length ? "." + n.classList.value.trim().replace(/\s+/g, ".") : "");
      if (i.length + r.length > (t || 100) - 1) return i || r;
      if (i = i ? r + ">" + i : r, n.id) break;
      e = n.parentNode;
    }
  } catch {
  }
  return i;
}, H = -1, J = function() {
  return H;
}, y = function(e) {
  addEventListener("pageshow", function(t) {
    t.persisted && (H = t.timeStamp, e(t));
  }, !0);
}, C = function() {
  var e = h();
  return e && e.activationStart || 0;
}, m = function(e, t) {
  var i = h(), n = "navigate";
  return J() >= 0 ? n = "back-forward-cache" : i && (document.prerendering || C() > 0 ? n = "prerender" : document.wasDiscarded ? n = "restore" : i.type && (n = i.type.replace(/_/g, "-"))), { name: e, value: t === void 0 ? -1 : t, rating: "good", delta: 0, entries: [], id: "v3-".concat(Date.now(), "-").concat(Math.floor(8999999999999 * Math.random()) + 1e12), navigationType: n };
}, T = function(e, t, i) {
  try {
    if (PerformanceObserver.supportedEntryTypes.includes(e)) {
      var n = new PerformanceObserver(function(r) {
        Promise.resolve().then(function() {
          t(r.getEntries());
        });
      });
      return n.observe(Object.assign({ type: e, buffered: !0 }, i || {})), n;
    }
  } catch {
  }
}, g = function(e, t, i, n) {
  var r, o;
  return function(a) {
    t.value >= 0 && (a || n) && ((o = t.value - (r || 0)) || r === void 0) && (r = t.value, t.delta = o, t.rating = function(u, c) {
      return u > c[1] ? "poor" : u > c[0] ? "needs-improvement" : "good";
    }(t.value, i), e(t));
  };
}, F = function(e) {
  requestAnimationFrame(function() {
    return requestAnimationFrame(function() {
      return e();
    });
  });
}, V = function(e) {
  var t = function(i) {
    i.type !== "pagehide" && document.visibilityState !== "hidden" || e(i);
  };
  addEventListener("visibilitychange", t, !0), addEventListener("pagehide", t, !0);
}, U = function(e) {
  var t = !1;
  return function(i) {
    t || (e(i), t = !0);
  };
}, p = -1, W = function() {
  return document.visibilityState !== "hidden" || document.prerendering ? 1 / 0 : 0;
}, S = function(e) {
  document.visibilityState === "hidden" && p > -1 && (p = e.type === "visibilitychange" ? e.timeStamp : 0, Y());
}, B = function() {
  addEventListener("visibilitychange", S, !0), addEventListener("prerenderingchange", S, !0);
}, Y = function() {
  removeEventListener("visibilitychange", S, !0), removeEventListener("prerenderingchange", S, !0);
}, z = function() {
  return p < 0 && (p = W(), B(), y(function() {
    setTimeout(function() {
      p = W(), B();
    }, 0);
  })), { get firstHiddenTime() {
    return p;
  } };
}, w = function(e) {
  document.prerendering ? addEventListener("prerenderingchange", function() {
    return e();
  }, !0) : e();
}, A = [1800, 3e3], _ = function(e, t) {
  t = t || {}, w(function() {
    var i, n = z(), r = m("FCP"), o = T("paint", function(a) {
      a.forEach(function(u) {
        u.name === "first-contentful-paint" && (o.disconnect(), u.startTime < n.firstHiddenTime && (r.value = Math.max(u.startTime - C(), 0), r.entries.push(u), i(!0)));
      });
    });
    o && (i = g(e, r, A, t.reportAllChanges), y(function(a) {
      r = m("FCP"), i = g(e, r, A, t.reportAllChanges), F(function() {
        r.value = performance.now() - a.timeStamp, i(!0);
      });
    }));
  });
}, R = [0.1, 0.25], Z = function(e, t) {
  (function(i, n) {
    n = n || {}, _(U(function() {
      var r, o = m("CLS", 0), a = 0, u = [], c = function(s) {
        s.forEach(function(l) {
          if (!l.hadRecentInput) {
            var v = u[0], L = u[u.length - 1];
            a && l.startTime - L.startTime < 1e3 && l.startTime - v.startTime < 5e3 ? (a += l.value, u.push(l)) : (a = l.value, u = [l]);
          }
        }), a > o.value && (o.value = a, o.entries = u, r());
      }, f = T("layout-shift", c);
      f && (r = g(i, o, R, n.reportAllChanges), V(function() {
        c(f.takeRecords()), r(!0);
      }), y(function() {
        a = 0, o = m("CLS", 0), r = g(i, o, R, n.reportAllChanges), F(function() {
          return r();
        });
      }), setTimeout(r, 0));
    }));
  })(function(i) {
    (function(n) {
      if (n.entries.length) {
        var r = n.entries.reduce(function(u, c) {
          return u && u.value > c.value ? u : c;
        });
        if (r && r.sources && r.sources.length) {
          var o = (a = r.sources).find(function(u) {
            return u.node && u.node.nodeType === 1;
          }) || a[0];
          if (o) return void (n.attribution = { largestShiftTarget: O(o.node), largestShiftTime: r.startTime, largestShiftValue: r.value, largestShiftSource: o, largestShiftEntry: r, loadState: E(r.startTime) });
        }
      }
      var a;
      n.attribution = {};
    })(i), e(i);
  }, t);
}, $ = function(e, t) {
  _(function(i) {
    (function(n) {
      if (n.entries.length) {
        var r = h(), o = n.entries[n.entries.length - 1];
        if (r) {
          var a = r.activationStart || 0, u = Math.max(0, r.responseStart - a);
          return void (n.attribution = { timeToFirstByte: u, firstByteToFCP: n.value - u, loadState: E(n.entries[0].startTime), navigationEntry: r, fcpEntry: o });
        }
      }
      n.attribution = { timeToFirstByte: 0, firstByteToFCP: n.value, loadState: E(J()) };
    })(i), e(i);
  }, t);
}, G = 0, x = 1 / 0, b = 0, ee = function(e) {
  e.forEach(function(t) {
    t.interactionId && (x = Math.min(x, t.interactionId), b = Math.max(b, t.interactionId), G = b ? (b - x) / 7 + 1 : 0);
  });
}, K = function() {
  return M ? G : performance.interactionCount || 0;
}, te = function() {
  "interactionCount" in performance || M || (M = T("event", ee, { type: "event", buffered: !0, durationThreshold: 0 }));
}, k = [200, 500], Q = 0, N = function() {
  return K() - Q;
}, d = [], I = {}, D = function(e) {
  var t = d[d.length - 1], i = I[e.interactionId];
  if (i || d.length < 10 || e.duration > t.latency) {
    if (i) i.entries.push(e), i.latency = Math.max(i.latency, e.duration);
    else {
      var n = { id: e.interactionId, latency: e.duration, entries: [e] };
      I[n.id] = n, d.push(n);
    }
    d.sort(function(r, o) {
      return o.latency - r.latency;
    }), d.splice(10).forEach(function(r) {
      delete I[r.id];
    });
  }
}, ne = function(e, t) {
  t = t || {}, w(function() {
    var i;
    te();
    var n, r = m("INP"), o = function(u) {
      u.forEach(function(s) {
        s.interactionId && D(s), s.entryType === "first-input" && !d.some(function(l) {
          return l.entries.some(function(v) {
            return s.duration === v.duration && s.startTime === v.startTime;
          });
        }) && D(s);
      });
      var c, f = (c = Math.min(d.length - 1, Math.floor(N() / 50)), d[c]);
      f && f.latency !== r.value && (r.value = f.latency, r.entries = f.entries, n());
    }, a = T("event", o, { durationThreshold: (i = t.durationThreshold) !== null && i !== void 0 ? i : 40 });
    n = g(e, r, k, t.reportAllChanges), a && ("PerformanceEventTiming" in window && "interactionId" in PerformanceEventTiming.prototype && a.observe({ type: "first-input", buffered: !0 }), V(function() {
      o(a.takeRecords()), r.value < 0 && N() > 0 && (r.value = 0, r.entries = []), n(!0);
    }), y(function() {
      d = [], Q = K(), r = m("INP"), n = g(e, r, k, t.reportAllChanges);
    }));
  });
}, re = function(e, t) {
  ne(function(i) {
    (function(n) {
      if (n.entries.length) {
        var r = n.entries.sort(function(a, u) {
          return u.duration - a.duration || u.processingEnd - u.processingStart - (a.processingEnd - a.processingStart);
        })[0], o = n.entries.find(function(a) {
          return a.target;
        });
        n.attribution = { eventTarget: O(o && o.target), eventType: r.name, eventTime: r.startTime, eventEntry: r, loadState: E(r.startTime) };
      } else n.attribution = {};
    })(i), e(i);
  }, t);
}, q = [2500, 4e3], P = {}, ie = function(e, t) {
  (function(i, n) {
    n = n || {}, w(function() {
      var r, o = z(), a = m("LCP"), u = function(s) {
        var l = s[s.length - 1];
        l && l.startTime < o.firstHiddenTime && (a.value = Math.max(l.startTime - C(), 0), a.entries = [l], r());
      }, c = T("largest-contentful-paint", u);
      if (c) {
        r = g(i, a, q, n.reportAllChanges);
        var f = U(function() {
          P[a.id] || (u(c.takeRecords()), c.disconnect(), P[a.id] = !0, r(!0));
        });
        ["keydown", "click"].forEach(function(s) {
          addEventListener(s, function() {
            return setTimeout(f, 0);
          }, !0);
        }), V(f), y(function(s) {
          a = m("LCP"), r = g(i, a, q, n.reportAllChanges), F(function() {
            a.value = performance.now() - s.timeStamp, P[a.id] = !0, r(!0);
          });
        });
      }
    });
  })(function(i) {
    (function(n) {
      if (n.entries.length) {
        var r = h();
        if (r) {
          var o = r.activationStart || 0, a = n.entries[n.entries.length - 1], u = a.url && performance.getEntriesByType("resource").filter(function(L) {
            return L.name === a.url;
          })[0], c = Math.max(0, r.responseStart - o), f = Math.max(c, u ? (u.requestStart || u.startTime) - o : 0), s = Math.max(f, u ? u.responseEnd - o : 0), l = Math.max(s, a ? a.startTime - o : 0), v = { element: O(a.element), timeToFirstByte: c, resourceLoadDelay: f - c, resourceLoadTime: s - f, elementRenderDelay: l - s, navigationEntry: r, lcpEntry: a };
          return a.url && (v.url = a.url), u && (v.lcpResourceEntry = u), void (n.attribution = v);
        }
      }
      n.attribution = { timeToFirstByte: 0, resourceLoadDelay: 0, resourceLoadTime: 0, elementRenderDelay: n.value };
    })(i), e(i);
  }, t);
}, j = [800, 1800], oe = function e(t) {
  document.prerendering ? w(function() {
    return e(t);
  }) : document.readyState !== "complete" ? addEventListener("load", function() {
    return e(t);
  }, !0) : setTimeout(t, 0);
}, ae = function(e, t) {
  t = t || {};
  var i = m("TTFB"), n = g(e, i, j, t.reportAllChanges);
  oe(function() {
    var r = h();
    if (r) {
      var o = r.responseStart;
      if (o <= 0 || o > performance.now()) return;
      i.value = Math.max(o - C(), 0), i.entries = [r], n(!0), y(function() {
        i = m("TTFB", 0), (n = g(e, i, j, t.reportAllChanges))(!0);
      });
    }
  });
}, ue = function(e, t) {
  ae(function(i) {
    (function(n) {
      if (n.entries.length) {
        var r = n.entries[0], o = r.activationStart || 0, a = Math.max(r.domainLookupStart - o, 0), u = Math.max(r.connectStart - o, 0), c = Math.max(r.requestStart - o, 0);
        n.attribution = { waitingTime: a, dnsTime: u - a, connectionTime: c - u, requestTime: n.value - c, navigationEntry: r };
      } else n.attribution = { waitingTime: 0, dnsTime: 0, connectionTime: 0, requestTime: 0 };
    })(i), e(i);
  }, t);
};
function ce() {
  const e = navigator.userAgent;
  return e.indexOf("Edg/") > -1 || e.indexOf("Edge/") > -1 ? "Edge" : e.indexOf("OPR/") > -1 || e.indexOf("Opera") > -1 ? "Opera" : e.indexOf("Chrome") > -1 && e.indexOf("Edg") === -1 ? "Chrome" : e.indexOf("Safari") > -1 && e.indexOf("Chrome") === -1 ? "Safari" : e.indexOf("Firefox") > -1 ? "Firefox" : e.indexOf("MSIE") > -1 || e.indexOf("Trident/") > -1 ? "Internet Explorer" : "Unknown";
}
class se {
  constructor(t) {
    this.config = t, this.apiEndpoint = t.apiEndpoint || "http://localhost:5000/api/collect";
  }
  /**
   * Send metrics array to API endpoint
   * @param {Array} metricsArray - Array of metric objects
   */
  send(t) {
    if (!t || t.length === 0)
      return;
    const i = {
      metrics: t,
      browser: ce()
    };
    this.config.debug && console.log("[WebVitals] Sending metrics:", i);
    const n = new Blob([JSON.stringify(i)], {
      type: "application/json"
    });
    navigator.sendBeacon(this.apiEndpoint, n) || fetch(this.apiEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(i),
      keepalive: !0
    }).catch((o) => {
      this.config.debug && console.error("[WebVitals] Failed to send metrics:", o);
    });
  }
}
function le(e) {
  if (!e || !e.element) return null;
  try {
    let t = {
      selector: e.element
    };
    return e.url && (t.url = e.url), t;
  } catch {
    return null;
  }
}
function fe(e) {
  if (!e || !e.largestShiftTarget) return null;
  try {
    return {
      selector: e.largestShiftTarget
    };
  } catch {
    return null;
  }
}
function de(e) {
  if (!e || !e.eventTarget) return null;
  try {
    return {
      selector: e.eventTarget
    };
  } catch {
    return null;
  }
}
class me {
  constructor(t) {
    this.reporter = t, this.metrics = [], addEventListener("visibilitychange", () => {
      document.visibilityState === "hidden" && this.send();
    });
  }
  /**
   * Collect a metric and check if all batch metrics are ready
   * @param {Object} metric - Web Vitals metric object
   */
  collect(t) {
    const i = {
      name: t.name,
      value: t.value,
      rating: t.rating,
      delta: t.delta,
      id: t.idm,
      page: window.location.href
    };
    if (t.attribution) {
      if (t.name === "LCP") {
        const n = le(t.attribution);
        n && (i.element = n);
      }
      if (t.name === "CLS") {
        const n = fe(t.attribution);
        n && (i.element = n);
      }
      if (t.name === "INP") {
        const n = de(t.attribution);
        n && (i.element = n);
      }
    }
    this.metrics.push(i);
  }
  /**
   * Send collected metrics as an array
   */
  send() {
    this.metrics.length !== 0 && (this.reporter.send(this.metrics), this.metrics = []);
  }
}
function ge(e = {}) {
  const i = { ...{
    apiEndpoint: "http://localhost:5000/api/collect",
    debug: !1
  }, ...e }, n = new se(i), r = new me(n);
  return ie((o) => {
    i.debug && console.log("[WebVitals] LCP:", o.value), r.collect(o);
  }), $((o) => {
    i.debug && console.log("[WebVitals] FCP:", o.value), r.collect(o);
  }), Z((o) => {
    i.debug && console.log("[WebVitals] CLS:", o.value), r.collect(o);
  }, { reportAllChanges: !0 }), ue((o) => {
    i.debug && console.log("[WebVitals] TTFB:", o.value), r.collect(o);
  }), re((o) => {
    i.debug && console.log("[WebVitals] INP interaction:", o.value), r.collect(o);
  }, { reportAllChanges: !0 }), i.debug && console.log("[WebVitals] Initialized with config:", i), {
    batchCollector: r,
    reporter: n
  };
}
typeof window < "u" && setTimeout(() => {
  if (typeof window.onWebVitalsReady == "function")
    try {
      console.log && console.log("[WebVitals] Library loaded, calling window.onWebVitalsReady()"), window.onWebVitalsReady();
    } catch (e) {
      console.error("[WebVitals] Error in window.onWebVitalsReady callback:", e);
    }
}, 0);
export {
  ge as initWebVitals
};
