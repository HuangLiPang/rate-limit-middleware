"use strict";

// calculate the next reset time
// for X-RateLimit-Reset
function nextResetTime(resetInterval) {
  const d = new Date();
  d.setMilliseconds(d.getMilliseconds() + resetInterval);
  return d;
}

function MemoryStore(resetInterval) {
  // store hits IPs
  let hits = {};
  // the next reset time
  let resetTime = nextResetTime(resetInterval);

  // add hit time in hits
  this.increment = function(ip, callback) {
    if (hits[ip]) hits[ip]++;
    else hits[ip] = 1;
    callback(null, hits[ip], resetTime);
  };

  // reset all IPs in hits
  this.resetAll = function() {
    hits = {};
    resetTime = nextResetTime(resetInterval);
  };

  // reset all hits every resetInterval
  const interval = setInterval(this.resetAll, resetInterval);
  if (interval.unref) {
    interval.unref();
  }
}

function RateLimit(options) {
  options = Object.assign({
    resetInterval: 60 * 1000, // the interval for keeping records of requests ip in memory (unit is milliseconds)
    max: 1000, // max number of connections during the interval before sending a 429 response
    message: "Too many requests, please try again later.", // message after the hit time reaches the max
    statusCode: 429, // 429 status = Too Many Requests (RFC 6585)
    handler: function(req, res, next) {
      // the handler when reaching the max hit time
      res.status(options.statusCode).send(options.message);
    }
  }, options);

  // store to use for persisting rate limit data
  options.store = options.store || new MemoryStore(options.resetInterval);

  function rateLimit(req, res, next) {
    // get client's ip
    const ip = req.ip;

    options.store.increment(ip, function(err, current, resetTime) {
      if (err) {
        return next(err);
      }

      Promise.resolve(options.max)
        .catch(next)
        .then(max => {
          req.rateLimit = {
            limit: max,
            current: current,
            remaining: Math.max(max - current, 0),
            resetTime: resetTime
          };
          // set X-RateLimit-Remaining to remaning hit times
          res.setHeader("X-RateLimit-Remaining", req.rateLimit.remaining);
          // set X-RateLimit-Reset to next reset hit time
          res.setHeader("X-RateLimit-Reset", resetTime.getTime());

          // if the hit time is more than max hit time
          if (current > max) return options.handler(req, res, next);

          next();
        });
    });
  }
  return rateLimit;
}

module.exports = RateLimit;