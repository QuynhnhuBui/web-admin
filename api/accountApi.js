var passport = require('passport')
var Account = require('../models/account')
var Cart = require('../models/Cart')
var jwt = require('jsonwebtoken')
let request = require('request-promise')
const bcrypt = require('bcryptjs');
var salt = bcrypt.genSaltSync(10);
let base64 = require('base-64')
let mongoose = require('mongoose')
let handleAccountJwt = require('../handleAccountJwt')
let fs = require('fs')
const path = require('path')
let api = require('../config')
API_URL = api.API_URL

exports.login = async (req, res) => {
    let { username, password } = req.body
    if (username === null || username === undefined || password === null || password === undefined || password === "" || username === "") {
        return res.json({
            status: -1,
            message: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu',
            data: null
        })
    }
    username = username.toLowerCase()
    const check = await Account.findOne(
        {
            username: username,
            // password: password
        }
    )
    if (check !== null) {
        if (bcrypt.compareSync(`${password}`, check.password)) {
            const token1 = jwt.sign({ id: check.id }, 'jwt-secret')
            return res.json({
                status: 1,
                message: 'Thành công',
                data: {
                    token: token1,
                    userId: check.userId,
                    username: check.username,
                    fullName: check.fullName,
                    email: check.email,
                    avatarUrl: check.avatarUrl,
                    address: check.address,
                    accRole: check.accRole
                }
            })
        }
        else {
            return res.json({
                status: -1,
                message: 'Tên đăng nhập hoặc mật khẩu không chính xác',
                data: null
            })
        }
    }
    else {
        return res.json({
            status: -1,
            message: 'Không tìm thấy người dùng này',
            data: null
        })
    }
}
exports.logout = async (req, res) => {
    let accountId = handleAccountJwt.getAccountId(req)
    try {
        await Account.findOneAndUpdate(
            { _id: accountId },
            {
                notificationToken: {
                    token: null,
                    platform: null
                }
            }
        )
        res.json({
            status: 1,
            message: 'Đăng xuất thành công',
            data: null
        })
    } catch (error) {
        res.json({
            status: -1,
            message: 'Thất bại',
            data: null,
            error: error
        })
    }
}
exports.register = async (req, res) => {
    try {
        let email = req.body.email.toLowerCase()
        let username = req.body.username.toLowerCase()
        let password = req.body.password
        password = bcrypt.hashSync(password);
        const date = new Date()
        if (email === undefined || email === null) {
            return res.json({
                status: -1,
                message: ' Email không được bỏ trống!',
                data: null
            })
        }
        if (password === undefined || password === null || password === "") {
            return res.json({
                status: -1,
                message: 'Vui lòng nhập mật khẩu!',
                data: null
            })
        }
        const checkAccount = await Account.findOne(
            { email: email }
        )
        const checkUsername = await Account.findOne(
            { username: username }
        )
        if (checkAccount !== null) {
            return res.json({
                status: -1,
                message: 'Email đã được đăng ký!',
                data: null
            })
        } else if (checkUsername !== null) {
            return res.json({
                status: -1,
                message: 'Tên tài khoản đã tồn tại!',
                data: null
            })
        } else {
            const newAccount = new Account({
                _id: new mongoose.Types.ObjectId(),
                email: email,
                username: username,
                password: password,
                status: 1,
                created_at: date
            })
            const newCart = new Cart({
                _id: new mongoose.Types.ObjectId(),
                userId: newAccount._id,
                delete_at: null,
                total: null,
                last_modified: date,
                created_at: date
            })
            await newAccount.save().then(async () => {
                await newCart.save().then(() => {
                    return res.json({
                        status: 1,
                        message: 'Đăng ký thành công!',
                        data: {
                            username: username,
                        }
                    })
                })
            })
        }
    } catch (error) {
        console.log(error)
        return res.json({
            status: -1,
            message: 'Failed !',
            data: null
        })
    }
}
exports.getUserByName = async (req, res) => {
    try {
        let username = req.body.username
        if (username === null || username === undefined) {
            return res.json({
                status: -1,
                message: 'Vui lòng nhập username',
                data: null
            })
        }
        const account = await Account.findOne(
            { username: username }
        )
        if (user !== null) {
            return res.json({
                status: 1,
                message: 'Lấy thông tin thành công',
                data: {
                    userID: account._id,
                    username: account.username,
                    fullName: account.fullName,
                    email: account.email,
                    phone: account.phone,
                    address: account.address,
                    avatarUrl: account.avatarUrl,
                }
            })
        } else {
            return res.json({
                status: -1,
                message: 'Không tìm thấy người dùng này',
                data: null
            })
        }
    } catch {
        return res.json({
            status: -1,
            message: 'Có lỗi xảy ra! Không lấy được thông tin',
            data: null
        })
    }
}
exports.updateUserData = async (req, res) => {
    try {
        let accountId = handleAccountJwt.getAccountId(req)
        let { phone, fullName, address } = req.body
        let date = new Date()
        let today = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
        if (accountId == null) {
            return res.json({
                status: -1,
                message: 'Không tìm thấy người dùng này!',
                data: null,
            })
        }
        await Account.findOneAndUpdate(
            {
                _id: accountId
            },
            {
                phone: phone,
                fullName: fullName,
                address: address,
                last_modified: today
            })
            .then(async (data) => {
                if (data !== null) {
                    return res.json({
                        status: 1,
                        message: "Cập nhật thành công",
                        data: {
                            accountId: accountId
                        },
                    })
                }
                return res.json({
                    status: -1,
                    message: 'Cập nhật thất bại',
                    data: null,
                })
            })
    } catch (error) {
        return res.json({
            status: -1,
            message: 'Có sự cố xảy ra. Không cập nhật được thông tin!',
            data: null,
        })
    }
}
exports.updatePassword = async (req, res) => {
    try {
        let accountId = handleAccountJwt.getAccountId(req)
        let newPass = req.body.newpass
        let password = req.body.password
        console.log(req.body)
        let date = new Date()
        let today = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
        if (accountId == null) {
            return res.json({
                status: -1,
                message: 'Không tìm thấy người dùng này!',
                data: null,
            })
        }
        const check = await Account.findOne(
            {
                _id: accountId,
            }
        )
        let newPassWord = bcrypt.hashSync(newPass);
        if (bcrypt.compareSync(password, check.password)) {
            await Account.findOneAndUpdate(
                {
                    _id: accountId
                },
                {
                    password: newPassWord,
                    last_modified: today
                })
                .then(async (data) => {
                    if (data !== null) {
                        return res.json({
                            status: 1,
                            message: "Cập nhật thành công",
                            data: {
                                accountId: accountId
                            },
                        })
                    }
                    return res.json({
                        status: -1,
                        message: 'Cập nhật thất bại',
                        data: null,
                    })
                })
        } else {
            return res.json({
                status: -1,
                message: 'Mật khẩu cũ không đúng!',
                data: null,
            })
        }
    } catch (error) {
        console.log(error)
        return res.json({
            status: -1,
            message: 'Có sự cố xảy ra. Không cập nhật được mật khẩu!',
            data: null,
        })
    }
}
exports.getUserByToken = async (req, res) => {
    try {
        let accountId = handleAccountJwt.getAccountId(req)
        if (accountId !== null || accountId !== undefined) {
            const account = await Account.findOne(
                { _id: accountId }
            )
            if (account === null || account === undefined) {
                return res.json({
                    status: -1,
                    message: 'Không tìm thấy người dùng này !',
                    data: null,
                })
            } else {
                return res.json({
                    status: 1,
                    message: 'Lấy thông tin thành công',
                    data: {
                        userID: account._id,
                        username: account.username,
                        fullName: account.fullName,
                        email: account.email,
                        phone: account.phone,
                        address: account.address,
                        avatarUrl: account.avatarUrl,
                    }
                })
            }
        } else {
            return res.json({
                status: -1,
                message: 'Không tìm thấy người dùng này !',
                data: null,
            })
        }
    } catch{
        return res.json({
            status: -1,
            message: 'Có lỗi xảy ra! Không lấy được thông tin',
            data: null
        })
    }
}
exports.pushNotificationToken = async (req, res) => {
    let notificationToken = req.body.notificationToken
    let platform = req.body.platform
    let accountId = handleAccountJwt.getAccountId(req)
    try {
        await Account.findOneAndUpdate(
            {
                _id: accountId
            },
            {
                notificationToken: {
                    token: notificationToken,
                    platform: platform
                }
            }
        )

        let checkAccount = await Account.findOne({
            _id: accountId
        })

        if (checkAccount.notificationToken.token === notificationToken) {
            res.json({
                status: 1,
                message: 'Thành công',
                data: {
                    notificationToken: checkAccount.notificationToken
                }
            })
        }
        else {
            res.json({
                status: -1,
                message: 'Thất bại',
                data: null,
            })
        }
    } catch (error) {
        res.json({
            status: -1,
            message: 'Thất bại',
            data: null,
            error: error
        })
    }
}
exports.getNumOfNotification = async (req, res) => {
    let accountId = handleAccountJwt.getAccountId(req)

    try {
        let checkAccount = await Account.findOne({
            _id: accountId
        })

        if (checkAccount !== null && checkAccount !== undefined) {
            let length = 0
            for (const notification of checkAccount.notifications) {
                if (notification.status === 0) {
                    length = length + 1
                }
            }

            res.json({
                status: 1,
                message: 'Thành công',
                data: {
                    numOfNotification: length
                }
            })
        } else {
            res.json({
                status: -1,
                message: 'Thất bại',
                data: null,
            })
        }
    } catch (error) {
        res.json({
            status: -1,
            message: 'Thất bại',
            data: null,
            error: error
        })
    }
}
exports.clearNotification = async (req, res) => {
    let accountId = handleAccountJwt.getAccountId(req)
    let date = new Date()
    isoDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
    try {
        let checkAccount = await Account.updateMany(
            { _id: accountId },
            { $set: { 'notifications.$[].status': 1, 'notifications.$[].last_modified': isoDate } }
        )

        res.json({
            status: 1,
            message: 'Thành công',
            data: null
        })
    } catch (error) {
        res.json({
            status: -1,
            message: 'Thất bại',
            data: null,
            error: error
        })
    }
}
exports.getListNotification = async (req, res) => {
    let queryParams = req.query
    let accountId = handleAccountJwt.getAccountId(req)
    let pageSize = Number.parseInt(queryParams.pageSize)
    let page = Number.parseInt(queryParams.page)
    let result = []
    try {
        let notifications = await Account.aggregate(
            [
                { $unwind: "$notifications" },
                { $match: { _id: mongoose.Types.ObjectId(accountId) } },
            ]
        )
            .sort({ 'notifications.created_at': -1 })
            .limit(pageSize * page)
            .skip(pageSize * (page - 1))

        for (const noti of notifications) {
            result.push(noti.notifications)
        }

        return res.json({
            status: 1,
            message: 'Lấy danh sách thông báo thành công !',
            data: result
        })

    } catch (error) {
        res.json({
            status: -1,
            message: 'Có sự cố xảy ra. Không thể lấy danh sách thông báo !',
            data: null,
            error: error
        })
    }
}
exports.changeAvatar = async (req, res) => {
    let file = req.file
    let accountId = handleAccountJwt.getAccountId(req)
    let randomNumber = Math.floor(Math.random() * 1000000000) + 1
    let imageName = `${file.originalname}_${randomNumber}.png`
    let tmp_path = file.path
    let target_path = __dirname.replace('/api', '') + '/public/img/avatars' + imageName
    let src = fs.createReadStream(tmp_path)
    let dest = fs.createWriteStream(target_path)
    src.pipe(dest)
    src.on('end', async () => {
        fs.unlink(tmp_path, (err) => { console.log(err) })
        try {

            const account = await Account.findOne({
                _id: accountId
            })
            if (account.avatarUrl !== null || account.avatarUrl === undefined) {
                let currentAvatar = account.avatarUrl.replace(`${API_URL}/image/`, '')
                try {
                    fs.unlink(__dirname.replace('/api', '') + `/uploads/${currentAvatar}`, err => {
                        console.log(err)
                    })
                } catch (error) {
                    console.log(error)
                }
            }

            await Account.findOneAndUpdate(
                {
                    _id: accountId
                },
                {
                    avatarUrl: `${API_URL}/image/${imageName}`
                }
            )

            res.json({
                status: 1,
                message: 'Thay đổi ảnh đại diện thành công',
                data: {
                    imageUrl: `${API_URL}/image/${imageName}`
                }
            })


        } catch (error) {
            return res.json({
                status: -1,
                message: 'Có sự cố xảy ra. Không thể thay đổi ảnh đại diện !',
                data: null,
                error: error
            })
        }
    })
    src.on('error', (err) => {
        fs.unlink(tmp_path, (err) => { console.log(err) })
        return res.json({
            status: -1,
            message: 'Thất bại',
            data: null,
            error: error
        })
    })
}