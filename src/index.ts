import {app} from "./app";
import {SETTINGS} from "./settings";

app.listen(SETTINGS.PORT, () => {
    console.log('Server listening to port ' + SETTINGS.PORT);
});