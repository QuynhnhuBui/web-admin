const router = require('express').Router()
const accAuth = require('../middleware/accountAuth')
const adminAuth = require('../middleware/adminAuth')
const accountApi = require('../api/accountApi')
const productTypeApi = require('../api/productTypeApi')
const productApi = require('../api/productApi')
const cartApi = require('../api/cartApi')
const orderApi = require('../api/orderApi')
const accountAuth = require('../middleware/accountAuth')

let multer = require('multer')
let upload = multer({ dest: 'uploads' })

//Account route
router.route('/register')
  .post(accountApi.register)
router.route('/updateUserData')
  .post(accountApi.updateUserData)
router.route('/getUserByName')
  .post(accountApi.getUserByName)
router.route('/getUserLogin')
  .post(accountApi.getUserByToken)
router.route('/Account/changePass')
  .post(accountApi.updatePassword)
router.route('/Account/updateData')
  .post(accountApi.updateUserData)
router.route('/changeAvatar')
  .post(accountApi.changeAvatar)

router.route('/login')
  .post(accountApi.login)
router.route('/logout')
  .post(accountApi.logout)

router.route('/Mail')
  .post(orderApi.sendMail)

module.exports = router;