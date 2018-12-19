const maintainSchemaModel = require('../models/maintain_model.js');

module.exports = class Maintain {

  insertServerModel(req, res, next) {
    let maintain = new maintainSchemaModel({
      status: req.body.status,
    });

    maintain.save()
      .then(doc => {
        res.json("status save to db");
      })
      .catch(error => {
        console.log("error");
      })
  }

  updateMaintainStatus(req, res, next) {
    maintainSchemaModel.find({})
      .then(doc => {
        if (req.body.status === "true") {
          doc[0].status = true;
          doc[0].save()
            .then(value => {
              let result = {
                message: "update to success，status is TRUE now.",
                status: true
              };
              res.json(result);
            })
            .catch(err => {
              console.log(err);
            })
        } else if (req.body.status  === "false") {
          doc[0].status = false;
          doc[0].save()
            .then(value => {
              let result = {
                message: "update to success，status is FALSE now.",
                status: false
              };
                res.json(result);
             })
              .catch(err => {
                console.log(err);
             });
        } else {
          let result = {
            message: "Sorry, this is an error. Please send again"
          };
          res.json(result);
        }
      })
  }


  getMaintainStatus(req, res, next) {
    maintainSchemaModel.find({})
      .then(doc=> {
        res.json(doc[0]);
      })
      .catch(err => console.log(err));
  }
}