import { Typography, Container } from "@mui/material";

const UnderConstruction = () => {
  return (
    <Container className="flex flex-col items-center justify-center h-screen text-center">
      <Typography variant="h4" className="text-gray-700 mb-4">
        🚧 Page Under Construction 🚧
      </Typography>
      <Typography variant="body1" className="text-gray-500">
        We're working hard to bring you this feature. Check back soon!
      </Typography>
    </Container>
  );
};

export default UnderConstruction;
