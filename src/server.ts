import app from "./app";

const PORT = process.env.PORT || 3800;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
