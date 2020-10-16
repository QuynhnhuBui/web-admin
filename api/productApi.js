var passport = require("passport");
var Account = require("../models/account");
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

function compare(a, b) {
  const saledA = parseInt(a.saled)
  const saledB = parseInt(b.saled)

  if (saledA < saledB) {
    return 1
  } else if (saledA > saledB) {
    return -1
  }
  return 0
}

exports.addProduct = async (req, res) => {
  let accountId = handleAccountJwt.getAccountId(req);
  let courseName = req.body.courseName;
  let trainer = req.body.trainer;
  let date = new Date();
  let today = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

  try {
    let createdBy = await Account.findOne({
      _id: accountId,
    });

    const newCourse = new Course({
      _id: new mongoose.Types.ObjectId(),
      name: courseName,
      trainer: trainer,
      startedDate: startedDate,
      endedDate: endedDate,
      building_id: buildingId,
      room_id: roomId,
      created_by: createdBy.username,
      created_at: today,
      last_modified: today,
    });

    await newCourse.save();

    return res.json({
      resultCode: 1,
      message: "Tạo sản phẩm mới thành công !",
      data: {
        course_id: newCourse._id,
        courseName: newCourse.name,
        trainer: newCourse.trainer,
        startedDate: newCourse.startedDate,
        endedDate: newCourse.endedDate,
        buildingName: await getBuildingName(buildingId),
        roomName: await getRoomName(roomId),
        created_by: newCourse.created_by,
      },
    });
  } catch (error) {
    console.log(error);
    return res.json({
      resultCode: -1,
      message: "Có sự cố xảy ra. Tạo sản phẩm không thành công !",
      data: null,
      error: error,
    });
  }
};
exports.getAllProduct = async (req, res) => {
  try {
    const listProductType = await ProductType.find();
    var listProduct = [];
    if (
      listProductType !== null ||
      listProductType !== undefined ||
      listProductType !== []
    ) {
      for (let ProType of listProductType) {
        if (ProType.product !== []) {
          for (let product of ProType.product) {
            listProduct.push(product);
          }
        }
      }

      return res.json({
        status: 1,
        message: "Lấy danh sách sản phẩm thành công",
        data: listProduct,
      });
    } else {
      return res.json({
        status: -1,
        message: "Không có sản phẩm nào",
        data: null,
      });
    }
  } catch (error) {
    console.log(error);
    return res.json({
      status: -1,
      message: "Có lỗi xảy ra. Không lấy được sản phẩm",
      data: null,
    });
  }
};
exports.getProductByProType = async (req, res) => {

  let { ProTypeId, limit, page } = req.body;
  let skip = parseInt(limit) * parseInt(page)
  try {
    if (ProTypeId === null || ProTypeId === undefined) {
      return res.json({
        status: -1,
        message: "Vui lòng nhập tên loại",
        data: null,
      });
    }
    let productTypes = await ProductType.find(
      { "_id": ProTypeId },
      { product: { $slice: [skip, parseInt(limit)] } },
    )

    productTypes = productTypes[0]
    product = productTypes.product.sort(compare);
    if (productTypes !== null) {
      return res.json({
        status: 1,
        message: "Lấy danh sách sản phẩm thành công",
        data: {
          typeId: productTypes._id,
          typeName: productTypes.typeName,
          typeImg: productTypes.typeImg,
          product: product,
          description: productTypes.description,
        },
      });
    } else {
      return res.json({
        status: -1,
        message: "Không có loại sản phẩm này",
        data: null,
      });
    }
  } catch (error) {
    console.log(error);
    return res.json({
      status: -1,
      message: "Có lỗi xảy ra. Không lấy được loại sản phẩm",
      data: null,
    });
  }
};
exports.getProductByName = async (req, res) => {
  try {
    const productName = req.body.productName;
    if (productName === null || productName === undefined) {
      return res.json({
        status: -1,
        message: "Vui lòng nhập tên sản phẩm",
        data: null,
      });
    }
    const listProductType = await ProductType.find();
    var listProduct = [];
    if (
      listProductType !== null ||
      listProductType !== undefined ||
      listProductType !== []
    ) {
      for (let ProType of listProductType) {
        if (ProType.product !== []) {
          for (let product of ProType.product) {
            if (product !== null || product !== []) {
              if (product.productName.includes(productName)) {
                listProduct.push(product);
              }
            }
          }
        }
      }
      return res.json({
        status: 1,
        message: "Lấy danh sách sản phẩm thành công",
        data: listProduct,
      });
    } else {
      return res.json({
        status: -1,
        message: "Không có sản phẩm nào",
        data: null,
      });
    }
  } catch (error) {
    console.log(error);
    return res.json({
      status: -1,
      message: "Có lỗi xảy ra. Không lấy được sản phẩm",
      data: null,
    });
  }
};
exports.getProductById = async (req, res) => {
  try {
    let productId = req.body.productId;
    if (productId === null || productId === undefined) {
      return res.json({
        status: -1,
        message: "Vui lòng nhập productId",
        data: null,
      });
    }
    const productTypes = await ProductType.find();
    if (productTypes !== null) {
      for (let type of productTypes) {
        if (type.product !== undefined || type.product !== null) {
          for (let product of type.product) {
            if (product._id == productId) {
              return res.json({
                status: 1,
                message: "Lấy sản phẩm thành công",
                data: product,
              });
            }
          }
        }
      }
      return res.json({
        status: -1,
        message: "Không tìm thấy sản phẩm này",
        data: null,
      });
    } else {
      return res.json({
        status: -1,
        message: "Không có sản phẩm nào trong hệ thống",
        data: null,
      });
    }
  } catch (error) {
    console.log(error);
    return res.json({
      status: -1,
      message: "Có lỗi xảy ra. Không lấy được loại sản phẩm",
      data: null,
    });
  }
};
exports.searchProduct = async (req, res) => {
  try {
    let searchKey = req.body.searchKey;
    console.log(searchKey)
    const findProducts = await ProductType.find({
      delete_at: null,
      "product.productName": { $regex: `${searchKey}` },
    });
    let products = [];
    for (let ProType of findProducts) {
      if (ProType.product !== []) {
        for (let product of ProType.product) {
          if (product.productName.search(`${searchKey}`) !== -1) {
            products.push(product);
          }
        }
      }
    }
    return res.json({
      status: 1,
      message: "Lấy danh sách sản phẩm thành công",
      data: products,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      status: -1,
      message: "Có lỗi xảy ra. Không lấy được sản phẩm",
      data: null,
    });
  }
};