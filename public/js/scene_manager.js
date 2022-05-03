class SceneManager {

    constructor() {
        this.scenes = {}
        var scenes = document.getElementsByClassName("scene");
        for(var i=0; i<scenes.length; i++) {
            var scene = scenes[i];
            this.scenes[scene.id] = [
                {first_call: true, scene},
                null
            ];
        }
    }

    define(scene_name, fn) {
        if(scene_name in this.scenes) {
            this.scenes[scene_name][1] = fn;
        }
    }
    
    switch(scene_old, scene_new, msg=null) {
        /* hide old scene */
        if(scene_old !== null) {
            document.getElementById(scene_old).style.display = "none";
        }
        /* show new scene */
        document.getElementById(scene_new).style.display = "block";
        if(!(scene_new in this.scenes)) {
            return;
        }
        var scene = this.scenes[scene_new];
        if(scene[1] === null) { return; }

        scene[1](scene[0], msg);
        if(scene[0].first_call) {
            scene[0].first_call = false;
        }
    }


}

