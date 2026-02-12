module.exports = (req, res, next) => {
  console.log("Received token:", req.headers['admin-token']);
  console.log("Expected token:", process.env.ADMIN_SECRET);
  
  if (!req.headers['admin-token']) {
    return res.status(403).json({ error: "No token provided" });
  }
  
  const receivedToken = req.headers['admin-token'].trim();
  const expectedToken = process.env.ADMIN_SECRET.trim();
  
  if (receivedToken === expectedToken) {
    console.log("✅ Admin token validated successfully");
    next();
  } else {
    console.log("❌ Admin token validation failed");
    res.status(403).json({ 
      error: "Invalid token",
      received: receivedToken,
      expected: expectedToken
    });
  }
};