const express = require("express");
const app = express();

// app.use('/name', (req, res) => {
//     res.json({
//         desc: 'all test use',
//         method: req.method,
//     })
// })

// get post delete put ?name=123
app.all("/test", (req, res) => {
  res.json({
    desc: "all test",
    method: req.method,
    query: req.query
  });
});
// name/aaa
// app.all("*", (req, res) => {
//   res.json({
//     desc: "all test uri",
//     method: req.method,
//     params: req.params
//   });
// });

app.listen(8080, () => {
  console.log("qidong cg");
});
