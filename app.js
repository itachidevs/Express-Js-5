const express = require('express')
const app = express()
app.use(express.json())
const path = require('path')
const {open} = require('sqlite')
const sqlite = require('sqlite3')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const dbpath = path.join(__dirname, 'twitterClone.db')
let db = null
const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite.Database,
    })
  } catch (e) {
    console.log(e.message)
    process.exit(-1)
  }
  app.listen(3000, () => {
    console.log('SERVER STARTED')
  })
}
initializeDBandServer()
//API 1
app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const databaseUser = await database.get(selectUserQuery)

  if (databaseUser === undefined) {
    const createUserQuery = `
     INSERT INTO
      user (username, name, password, gender, location)
     VALUES
      (
       '${username}',
       '${name}',
       '${hashedPassword}',
       '${gender}',
       '${location}'  
      );`
    if (validatePassword(password)) {
      await database.run(createUserQuery)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const databaseUser = await database.get(selectUserQuery)

  if (databaseUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      databaseUser.password,
    )
    if (isPasswordMatched === true) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})
//API 2
const authenticateToken = (request, response, next) => {
  let jwtToken
  const authHeader = request.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid JWT Token')
  } else {
    username = request.username
    jwt.verify(jwtToken, 'SECRET_TOKEN', async (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        next()
      }
    })
  }
}
app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const databaseUser = await db.get(selectUserQuery)
  if (databaseUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      databaseUser.password,
    )
    if (isPasswordMatched === true) {
      const payload = {
        username: username,
      }
      const jwtToken = jwt.sign(payload, 'SECRET_TOKEN')
      response.send({jwtToken})
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})
//API 3
app.get('/user/tweets/feed', authenticateToken, async (request, response) => {
  let result = await db.all(
    `SELECT user.name AS name, tweet.tweet AS tweet, tweet.date_time AS dateTime FROM (user INNER JOIN follower ON follower.follower_id=user.user_id) AS T INNER JOIN tweet ON T.following_user_id=tweet.user_id  ORDER BY dateTime DESC  LIMIT 4;`,
  )
  response.send(result)
})
//API 4
app.get('/user/following/', authenticateToken, async (request, response) => {
  // let {username} = request.body
  // console.log(username)
  let result = await db.all(
    `SELECT user.name AS name FROM follower INNER JOIN user ON follower.following_user_id=user.user_id;`,
  )
  console.log(result)
  response.send(result)
})
//API 5
app.get('/user/followers', authenticateToken, async (request, response) => {
  response.send(
    await db.all(
      `SELECT user.name AS name FROM follower INNER JOIN user ON follower.follower_user_id=user.user_id`,
    ),
  )
})
//API 6
// app.get('/tweets/:tweetId/', authenticateToken, async (request, response) => {
//   let {twetId} = request.params
//   let dbUsers = `SELECT following_user_id FROM follower INNER JOIN tweet ON follwer.folowing_user_id=tweet.user_id WHERE tweet.tweet_id=${twetId}; `
// })
module.exports = app
