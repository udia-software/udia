import app from "./app";
import { NODE_ENV, PORT } from "./constants";

const server = app.listen(PORT, () => {
    // tslint:disable-next-line no-console
    console.log(`UDIA ${NODE_ENV} server running on port ${PORT}`);
});

export default server;
