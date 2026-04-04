//#region node_modules/web-vitals/dist/web-vitals.attribution.js
var e, t, n, r, i, a = function() {
	return window.performance && performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
}, o = function(e) {
	if (document.readyState === "loading") return "loading";
	var t = a();
	if (t) {
		if (e < t.domInteractive) return "loading";
		if (t.domContentLoadedEventStart === 0 || e < t.domContentLoadedEventStart) return "dom-interactive";
		if (t.domComplete === 0 || e < t.domComplete) return "dom-content-loaded";
	}
	return "complete";
}, s = function(e) {
	var t = e.nodeName;
	return e.nodeType === 1 ? t.toLowerCase() : t.toUpperCase().replace(/^#/, "");
}, c = function(e, t) {
	var n = "";
	try {
		for (; e && e.nodeType !== 9;) {
			var r = e, i = r.id ? "#" + r.id : s(r) + (r.classList && r.classList.value && r.classList.value.trim() && r.classList.value.trim().length ? "." + r.classList.value.trim().replace(/\s+/g, ".") : "");
			if (n.length + i.length > (t || 100) - 1) return n || i;
			if (n = n ? i + ">" + n : i, r.id) break;
			e = r.parentNode;
		}
	} catch {}
	return n;
}, l = -1, u = function() {
	return l;
}, d = function(e) {
	addEventListener("pageshow", (function(t) {
		t.persisted && (l = t.timeStamp, e(t));
	}), !0);
}, f = function() {
	var e = a();
	return e && e.activationStart || 0;
}, p = function(e, t) {
	var n = a(), r = "navigate";
	return u() >= 0 ? r = "back-forward-cache" : n && (document.prerendering || f() > 0 ? r = "prerender" : document.wasDiscarded ? r = "restore" : n.type && (r = n.type.replace(/_/g, "-"))), {
		name: e,
		value: t === void 0 ? -1 : t,
		rating: "good",
		delta: 0,
		entries: [],
		id: `v3-${Date.now()}-${Math.floor(8999999999999 * Math.random()) + 0xe8d4a51000}`,
		navigationType: r
	};
}, m = function(e, t, n) {
	try {
		if (PerformanceObserver.supportedEntryTypes.includes(e)) {
			var r = new PerformanceObserver((function(e) {
				Promise.resolve().then((function() {
					t(e.getEntries());
				}));
			}));
			return r.observe(Object.assign({
				type: e,
				buffered: !0
			}, n || {})), r;
		}
	} catch {}
}, h = function(e, t, n, r) {
	var i, a;
	return function(o) {
		t.value >= 0 && (o || r) && ((a = t.value - (i || 0)) || i === void 0) && (i = t.value, t.delta = a, t.rating = function(e, t) {
			return e > t[1] ? "poor" : e > t[0] ? "needs-improvement" : "good";
		}(t.value, n), e(t));
	};
}, g = function(e) {
	requestAnimationFrame((function() {
		return requestAnimationFrame((function() {
			return e();
		}));
	}));
}, _ = function(e) {
	var t = function(t) {
		t.type !== "pagehide" && document.visibilityState !== "hidden" || e(t);
	};
	addEventListener("visibilitychange", t, !0), addEventListener("pagehide", t, !0);
}, v = function(e) {
	var t = !1;
	return function(n) {
		t ||= (e(n), !0);
	};
}, y = -1, b = function() {
	return document.visibilityState !== "hidden" || document.prerendering ? Infinity : 0;
}, x = function(e) {
	document.visibilityState === "hidden" && y > -1 && (y = e.type === "visibilitychange" ? e.timeStamp : 0, C());
}, S = function() {
	addEventListener("visibilitychange", x, !0), addEventListener("prerenderingchange", x, !0);
}, C = function() {
	removeEventListener("visibilitychange", x, !0), removeEventListener("prerenderingchange", x, !0);
}, w = function() {
	return y < 0 && (y = b(), S(), d((function() {
		setTimeout((function() {
			y = b(), S();
		}), 0);
	}))), { get firstHiddenTime() {
		return y;
	} };
}, T = function(e) {
	document.prerendering ? addEventListener("prerenderingchange", (function() {
		return e();
	}), !0) : e();
}, E = [1800, 3e3], D = function(e, t) {
	t ||= {}, T((function() {
		var n, r = w(), i = p("FCP"), a = m("paint", (function(e) {
			e.forEach((function(e) {
				e.name === "first-contentful-paint" && (a.disconnect(), e.startTime < r.firstHiddenTime && (i.value = Math.max(e.startTime - f(), 0), i.entries.push(e), n(!0)));
			}));
		}));
		a && (n = h(e, i, E, t.reportAllChanges), d((function(r) {
			i = p("FCP"), n = h(e, i, E, t.reportAllChanges), g((function() {
				i.value = performance.now() - r.timeStamp, n(!0);
			}));
		})));
	}));
}, O = [.1, .25], k = function(e, t) {
	(function(e, t) {
		t ||= {}, D(v((function() {
			var n, r = p("CLS", 0), i = 0, a = [], o = function(e) {
				e.forEach((function(e) {
					if (!e.hadRecentInput) {
						var t = a[0], n = a[a.length - 1];
						i && e.startTime - n.startTime < 1e3 && e.startTime - t.startTime < 5e3 ? (i += e.value, a.push(e)) : (i = e.value, a = [e]);
					}
				})), i > r.value && (r.value = i, r.entries = a, n());
			}, s = m("layout-shift", o);
			s && (n = h(e, r, O, t.reportAllChanges), _((function() {
				o(s.takeRecords()), n(!0);
			})), d((function() {
				i = 0, r = p("CLS", 0), n = h(e, r, O, t.reportAllChanges), g((function() {
					return n();
				}));
			})), setTimeout(n, 0));
		})));
	})((function(t) {
		(function(e) {
			if (e.entries.length) {
				var t = e.entries.reduce((function(e, t) {
					return e && e.value > t.value ? e : t;
				}));
				if (t && t.sources && t.sources.length) {
					var n = (r = t.sources).find((function(e) {
						return e.node && e.node.nodeType === 1;
					})) || r[0];
					if (n) return void (e.attribution = {
						largestShiftTarget: c(n.node),
						largestShiftTime: t.startTime,
						largestShiftValue: t.value,
						largestShiftSource: n,
						largestShiftEntry: t,
						loadState: o(t.startTime)
					});
				}
			}
			var r;
			e.attribution = {};
		})(t), e(t);
	}), t);
}, A = function(e, t) {
	D((function(t) {
		(function(e) {
			if (e.entries.length) {
				var t = a(), n = e.entries[e.entries.length - 1];
				if (t) {
					var r = t.activationStart || 0, i = Math.max(0, t.responseStart - r);
					e.attribution = {
						timeToFirstByte: i,
						firstByteToFCP: e.value - i,
						loadState: o(e.entries[0].startTime),
						navigationEntry: t,
						fcpEntry: n
					};
					return;
				}
			}
			e.attribution = {
				timeToFirstByte: 0,
				firstByteToFCP: e.value,
				loadState: o(u())
			};
		})(t), e(t);
	}), t);
}, j = {
	passive: !0,
	capture: !0
}, M = /* @__PURE__ */ new Date(), N = function(r, i) {
	e || (e = i, t = r, n = /* @__PURE__ */ new Date(), P(removeEventListener), ee());
}, ee = function() {
	if (t >= 0 && t < n - M) {
		var i = {
			entryType: "first-input",
			name: e.type,
			target: e.target,
			cancelable: e.cancelable,
			startTime: e.timeStamp,
			processingStart: e.timeStamp + t
		};
		r.forEach((function(e) {
			e(i);
		})), r = [];
	}
}, te = function(e) {
	if (e.cancelable) {
		var t = (e.timeStamp > 0xe8d4a51000 ? /* @__PURE__ */ new Date() : performance.now()) - e.timeStamp;
		e.type == "pointerdown" ? function(e, t) {
			var n = function() {
				N(e, t), i();
			}, r = function() {
				i();
			}, i = function() {
				removeEventListener("pointerup", n, j), removeEventListener("pointercancel", r, j);
			};
			addEventListener("pointerup", n, j), addEventListener("pointercancel", r, j);
		}(t, e) : N(t, e);
	}
}, P = function(e) {
	[
		"mousedown",
		"keydown",
		"touchstart",
		"pointerdown"
	].forEach((function(t) {
		return e(t, te, j);
	}));
}, F = 0, I = Infinity, L = 0, R = function(e) {
	e.forEach((function(e) {
		e.interactionId && (I = Math.min(I, e.interactionId), L = Math.max(L, e.interactionId), F = L ? (L - I) / 7 + 1 : 0);
	}));
}, z = function() {
	return i ? F : performance.interactionCount || 0;
}, ne = function() {
	"interactionCount" in performance || i || (i = m("event", R, {
		type: "event",
		buffered: !0,
		durationThreshold: 0
	}));
}, B = [200, 500], V = 0, H = function() {
	return z() - V;
}, U = [], W = {}, G = function(e) {
	var t = U[U.length - 1], n = W[e.interactionId];
	if (n || U.length < 10 || e.duration > t.latency) {
		if (n) n.entries.push(e), n.latency = Math.max(n.latency, e.duration);
		else {
			var r = {
				id: e.interactionId,
				latency: e.duration,
				entries: [e]
			};
			W[r.id] = r, U.push(r);
		}
		U.sort((function(e, t) {
			return t.latency - e.latency;
		})), U.splice(10).forEach((function(e) {
			delete W[e.id];
		}));
	}
}, K = function(e, t) {
	t ||= {}, T((function() {
		ne();
		var n, r = p("INP"), i = function(e) {
			e.forEach((function(e) {
				(e.interactionId && G(e), e.entryType === "first-input") && !U.some((function(t) {
					return t.entries.some((function(t) {
						return e.duration === t.duration && e.startTime === t.startTime;
					}));
				})) && G(e);
			}));
			var t, i = (t = Math.min(U.length - 1, Math.floor(H() / 50)), U[t]);
			i && i.latency !== r.value && (r.value = i.latency, r.entries = i.entries, n());
		}, a = m("event", i, { durationThreshold: t.durationThreshold ?? 40 });
		n = h(e, r, B, t.reportAllChanges), a && ("PerformanceEventTiming" in window && "interactionId" in PerformanceEventTiming.prototype && a.observe({
			type: "first-input",
			buffered: !0
		}), _((function() {
			i(a.takeRecords()), r.value < 0 && H() > 0 && (r.value = 0, r.entries = []), n(!0);
		})), d((function() {
			U = [], V = z(), r = p("INP"), n = h(e, r, B, t.reportAllChanges);
		})));
	}));
}, q = function(e, t) {
	K((function(t) {
		(function(e) {
			if (e.entries.length) {
				var t = e.entries.sort((function(e, t) {
					return t.duration - e.duration || t.processingEnd - t.processingStart - (e.processingEnd - e.processingStart);
				}))[0], n = e.entries.find((function(e) {
					return e.target;
				}));
				e.attribution = {
					eventTarget: c(n && n.target),
					eventType: t.name,
					eventTime: t.startTime,
					eventEntry: t,
					loadState: o(t.startTime)
				};
			} else e.attribution = {};
		})(t), e(t);
	}), t);
}, J = [2500, 4e3], Y = {}, X = function(e, t) {
	(function(e, t) {
		t ||= {}, T((function() {
			var n, r = w(), i = p("LCP"), a = function(e) {
				var t = e[e.length - 1];
				t && t.startTime < r.firstHiddenTime && (i.value = Math.max(t.startTime - f(), 0), i.entries = [t], n());
			}, o = m("largest-contentful-paint", a);
			if (o) {
				n = h(e, i, J, t.reportAllChanges);
				var s = v((function() {
					Y[i.id] || (a(o.takeRecords()), o.disconnect(), Y[i.id] = !0, n(!0));
				}));
				["keydown", "click"].forEach((function(e) {
					addEventListener(e, (function() {
						return setTimeout(s, 0);
					}), !0);
				})), _(s), d((function(r) {
					i = p("LCP"), n = h(e, i, J, t.reportAllChanges), g((function() {
						i.value = performance.now() - r.timeStamp, Y[i.id] = !0, n(!0);
					}));
				}));
			}
		}));
	})((function(t) {
		(function(e) {
			if (e.entries.length) {
				var t = a();
				if (t) {
					var n = t.activationStart || 0, r = e.entries[e.entries.length - 1], i = r.url && performance.getEntriesByType("resource").filter((function(e) {
						return e.name === r.url;
					}))[0], o = Math.max(0, t.responseStart - n), s = Math.max(o, i ? (i.requestStart || i.startTime) - n : 0), l = Math.max(s, i ? i.responseEnd - n : 0), u = Math.max(l, r ? r.startTime - n : 0), d = {
						element: c(r.element),
						timeToFirstByte: o,
						resourceLoadDelay: s - o,
						resourceLoadTime: l - s,
						elementRenderDelay: u - l,
						navigationEntry: t,
						lcpEntry: r
					};
					r.url && (d.url = r.url), i && (d.lcpResourceEntry = i), e.attribution = d;
					return;
				}
			}
			e.attribution = {
				timeToFirstByte: 0,
				resourceLoadDelay: 0,
				resourceLoadTime: 0,
				elementRenderDelay: e.value
			};
		})(t), e(t);
	}), t);
}, Z = [800, 1800], re = function e(t) {
	document.prerendering ? T((function() {
		return e(t);
	})) : document.readyState === "complete" ? setTimeout(t, 0) : addEventListener("load", (function() {
		return e(t);
	}), !0);
}, ie = function(e, t) {
	t ||= {};
	var n = p("TTFB"), r = h(e, n, Z, t.reportAllChanges);
	re((function() {
		var i = a();
		if (i) {
			var o = i.responseStart;
			if (o <= 0 || o > performance.now()) return;
			n.value = Math.max(o - f(), 0), n.entries = [i], r(!0), d((function() {
				n = p("TTFB", 0), (r = h(e, n, Z, t.reportAllChanges))(!0);
			}));
		}
	}));
}, ae = function(e, t) {
	ie((function(t) {
		(function(e) {
			if (e.entries.length) {
				var t = e.entries[0], n = t.activationStart || 0, r = Math.max(t.domainLookupStart - n, 0), i = Math.max(t.connectStart - n, 0), a = Math.max(t.requestStart - n, 0);
				e.attribution = {
					waitingTime: r,
					dnsTime: i - r,
					connectionTime: a - i,
					requestTime: e.value - a,
					navigationEntry: t
				};
			} else e.attribution = {
				waitingTime: 0,
				dnsTime: 0,
				connectionTime: 0,
				requestTime: 0
			};
		})(t), e(t);
	}), t);
};
//#endregion
//#region src/utils/helpers.js
function oe() {
	let e = navigator.userAgent;
	return e.indexOf("Edg/") > -1 || e.indexOf("Edge/") > -1 ? "Edge" : e.indexOf("OPR/") > -1 || e.indexOf("Opera") > -1 ? "Opera" : e.indexOf("Chrome") > -1 && e.indexOf("Edg") === -1 ? "Chrome" : e.indexOf("Safari") > -1 && e.indexOf("Chrome") === -1 ? "Safari" : e.indexOf("Firefox") > -1 ? "Firefox" : e.indexOf("MSIE") > -1 || e.indexOf("Trident/") > -1 ? "Internet Explorer" : "Unknown";
}
//#endregion
//#region src/core/WebVitalsReporter.js
var se = class {
	constructor(e) {
		this.config = e, this.apiEndpoint = e.apiEndpoint || "http://localhost:3001/api/collect";
	}
	send(e, t = []) {
		if (!e || e.length === 0) return;
		let n = {
			metrics: e,
			browser: oe()
		};
		this.config.appId && (n.appId = this.config.appId), t.length > 0 && (n.resources = t, n.page = e[0]?.page || window.location.href), this.config.debug && console.log("[WebVitals] Sending metrics:", n);
		let r = new Blob([JSON.stringify(n)], { type: "text/plain" });
		navigator.sendBeacon(this.apiEndpoint, r) || fetch(this.apiEndpoint, {
			method: "POST",
			headers: { "Content-Type": "text/plain" },
			body: JSON.stringify(n),
			keepalive: !0
		}).catch((e) => {
			this.config.debug && console.error("[WebVitals] Failed to send metrics:", e);
		});
	}
};
//#endregion
//#region src/utils/elementInfo.js
function Q(e) {
	return e;
}
function ce(e) {
	if (!e || !e.element) return null;
	try {
		let t = { selector: Q(e.element) };
		return e.url && (t.url = e.url), t;
	} catch {
		return null;
	}
}
function le(e) {
	if (!e || !e.largestShiftTarget) return null;
	try {
		return { selector: Q(e.largestShiftTarget) };
	} catch {
		return null;
	}
}
function $(e) {
	if (!e || !e.eventTarget) return null;
	try {
		return { selector: Q(e.eventTarget) };
	} catch {
		return null;
	}
}
//#endregion
//#region src/core/BatchCollector.js
var ue = class {
	constructor(e) {
		this.reporter = e, this.metrics = [], addEventListener("visibilitychange", () => {
			document.visibilityState === "hidden" && this.send();
		});
	}
	collect(e) {
		let t = {
			name: e.name,
			value: e.value,
			rating: e.rating,
			delta: e.delta,
			id: e.id,
			page: window.location.href
		};
		if (e.attribution) {
			if (e.name === "LCP") {
				let n = ce(e.attribution);
				n && (t.element = n);
			}
			if (e.name === "CLS") {
				let n = le(e.attribution);
				n && (t.element = n);
			}
			if (e.name === "INP") {
				let n = $(e.attribution);
				n && (t.element = n);
			}
		}
		this.metrics.push(t);
	}
	send() {
		if (this.metrics.length === 0) return;
		let e = [];
		try {
			e = performance.getEntriesByType("resource").map((e) => ({
				name: e.name,
				initiatorType: e.initiatorType,
				startTime: Math.round(e.startTime * 100) / 100,
				duration: Math.round(e.duration * 100) / 100,
				redirectStart: Math.round(e.redirectStart * 100) / 100,
				redirectEnd: Math.round(e.redirectEnd * 100) / 100,
				fetchStart: Math.round(e.fetchStart * 100) / 100,
				dnsStart: Math.round(e.domainLookupStart * 100) / 100,
				dnsEnd: Math.round(e.domainLookupEnd * 100) / 100,
				connectStart: Math.round(e.connectStart * 100) / 100,
				connectEnd: Math.round(e.connectEnd * 100) / 100,
				secureConnectionStart: Math.round(e.secureConnectionStart * 100) / 100,
				requestStart: Math.round(e.requestStart * 100) / 100,
				responseStart: Math.round(e.responseStart * 100) / 100,
				responseEnd: Math.round(e.responseEnd * 100) / 100,
				transferSize: e.transferSize || 0,
				encodedBodySize: e.encodedBodySize || 0,
				decodedBodySize: e.decodedBodySize || 0,
				nextHopProtocol: e.nextHopProtocol || ""
			})), performance.clearResourceTimings();
		} catch {}
		this.reporter.send(this.metrics, e), this.metrics = [];
	}
};
//#endregion
//#region src/main.js
function de(e = {}) {
	let t = {
		apiEndpoint: "http://localhost:3001/api/collect",
		appId: void 0,
		debug: !1,
		...e
	}, n = new se(t), r = new ue(n);
	return X((e) => {
		t.debug && console.log("[WebVitals] LCP:", e.value), r.collect(e);
	}), A((e) => {
		t.debug && console.log("[WebVitals] FCP:", e.value), r.collect(e);
	}), k((e) => {
		t.debug && console.log("[WebVitals] CLS:", e.value), r.collect(e);
	}, { reportAllChanges: !0 }), ae((e) => {
		t.debug && console.log("[WebVitals] TTFB:", e.value), r.collect(e);
	}), q((e) => {
		t.debug && console.log("[WebVitals] INP interaction:", e.value), r.collect(e);
	}, { reportAllChanges: !0 }), t.debug && console.log("[WebVitals] Initialized with config:", t), {
		batchCollector: r,
		reporter: n
	};
}
typeof window < "u" && setTimeout(() => {
	if (typeof window.onWebVitalsReady == "function") try {
		console.log && console.log("[WebVitals] Library loaded, calling window.onWebVitalsReady()"), window.onWebVitalsReady();
	} catch (e) {
		console.error("[WebVitals] Error in window.onWebVitalsReady callback:", e);
	}
}, 0);
//#endregion
export { de as initWebVitals };
