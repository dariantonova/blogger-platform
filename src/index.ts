import {app} from "./app";
import {SETTINGS} from "./settings";
import {initialDb, runDb, setDb} from "./db/db";

const startApp = async () => {
    const res = await runDb(SETTINGS.MONGO_URL);
    if (!res) process.exit(1);

    await setDb(initialDb);
    app.listen(SETTINGS.PORT, () => {
        console.log('Server listening to port ' + SETTINGS.PORT);
    });
};

startApp();