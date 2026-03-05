import app from './app';
import { config } from './utils/config';

const port = config.PORT;

const server = app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
});

export default server;
