# rate-limit-middleware
rate limit middleware for limiting the ip requests in Express framework

### features
1. add X-RateLimit-Remaining in response headers and set remaining numbers of requests as its value
2. add X-RateLimit-Reset in response headers and set the time in millisecond to reset remaining numbers of requests as its value
3. if the max number of requests is reached, the middleware will respond 429 (Too Many Requests)

### usage
```javascript
const rateLimit = require("rate-limit");
var express = require('express');
var router = express.Router();

const limiter = rateLimit();

// get the card or wait
router.get('/', limiter, function(req, res) {
  res.send("get the card!");
});

module.exports = router;
```
