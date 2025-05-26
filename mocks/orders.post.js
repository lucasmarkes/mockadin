export default (req, res) => {
  const { product, quantity } = req.body;
  res.json({
    message: `Order received: ${quantity}x ${product}`,
    timestamp: new Date().toISOString(),
  });
};
