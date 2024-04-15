/*
 * Copyright (c) 2014-2023 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import challengeUtils = require('../lib/challengeUtils')
import { type Request, type Response, type NextFunction } from 'express'

const challenges = require('../data/datacache').challenges
const db = require('../data/mongodb')
const security = require('../lib/insecurity')

// vuln-code-snippet start noSqlReviewsChallenge forgedReviewChallenge
// module.exports = function productReviews () {
//   return (req: Request, res: Response, next: NextFunction) => {
//     const user = security.authenticatedUsers.from(req) // vuln-code-snippet vuln-line forgedReviewChallenge
//     db.reviews.update( // vuln-code-snippet neutral-line forgedReviewChallenge
//       { _id: req.body.id }, // vuln-code-snippet vuln-line noSqlReviewsChallenge forgedReviewChallenge
//       { $set: { message: req.body.message } },
//       { multi: true } // vuln-code-snippet vuln-line noSqlReviewsChallenge
//     ).then(
//       (result: { modified: number, original: Array<{ author: any }> }) => {
//         challengeUtils.solveIf(challenges.noSqlReviewsChallenge, () => { return result.modified > 1 }) // vuln-code-snippet hide-line
//         challengeUtils.solveIf(challenges.forgedReviewChallenge, () => { return user?.data && result.original[0] && result.original[0].author !== user.data.email && result.modified === 1 }) // vuln-code-snippet hide-line
//         res.json(result)
//       }, (err: unknown) => {
//         res.status(500).json(err)
//       })
//   }
// }

module.exports = function productReviews () {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = security.authenticatedUsers.from(req)
    db.reviews.update(
      { _id: req.body.id },
      { $set: { message: req.body.message } },
      { multi: true }
    ).then(
      (result: { modified: number, original: Array<{ author: any }> }) => {
        let userEmail = user?.data ? user.data.email.replace(/[a-zA-Z0-9]/g, 'x') + '@juice-shop' : 'xxxxn@juice-shop' // Che dấu tên người dùng nếu đã xác thực, ngược lại sử dụng giá trị mặc định
        challengeUtils.solveIf(challenges.noSqlReviewsChallenge, () => { return result.modified > 1 })
        challengeUtils.solveIf(challenges.forgedReviewChallenge, () => { return user?.data && result.original[0] && result.original[0].author !== userEmail && result.modified === 1 }) // Sử dụng biến userEmail thay vì user.data.email
        res.json(result)
      }, (err: unknown) => {
        res.status(500).json(err)
      })
  }
}

// vuln-code-snippet end noSqlReviewsChallenge forgedReviewChallenge
