var passport = require("passport");
var ProductType = require("../models/ProductTypes");
var jwt = require("jsonwebtoken");
let request = require("request-promise");
let base64 = require("base-64");
let mongoose = require("mongoose");
let handleAccountJwt = require("../handleAccountJwt");
let fs = require("fs");
const path = require("path");
let api = require("../config");
API_URL = api.API_URL;

exports.dashBoard = async (req, res) => {
  try {
    if(!req.session.isLogin){
      return res.render('login/login');
    }
    return res.render("product/ProductType", {
      user : req.session.user,
      listProductType,
      mgs: "",
      countPage: countPage,
    });
  } catch (error) {
    return res.send({ mgs: "Có lỗi xảy ra! Lấy danh sách thất bại" });
  }
};