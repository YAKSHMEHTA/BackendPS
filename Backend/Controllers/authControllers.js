import express from "express";
const router = express.Router();


const generateAccessToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.ACCESS_SECRET, {
    expiresIn: "15m",
  });
};

const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

export const login = ("/login", async (req, res) => {
  let { username, password } = req.body;

  if (!username || !password) {
    return res.send("Username and password both are required");
  }

  let user = await User.findOne({ username });
  if (!user) {
    return res.send("User not found");
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.send("wrong password");
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save();

  res.cookie("accessToken", accessToken, {
    secure: false,
    sameSite: "strict",
  });
  res.cookie("refreshToken", refreshToken, {
    secure: false,
    sameSite: "strict",
  });
  res.json({ accessToken });
});

export const signup = ("/signup", async (req, res) => {
  let { username, email, password } = req.body;
  console.log(req.body);
  let user = await User.findOne({ username });
  if (user) {
    return res.send("user already exist");
  }
  let hassedPassword = await bcrypt.hash(password, 10);
  let newuser = new User({
    username: username,
    email: email,
    password: hassedPassword,
  });
  await newuser.save();
  res.send("Signup successful");
});