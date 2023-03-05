import Audic from 'audic';

const PlayerState = Object.freeze({
    Playing: 1,
    Pause: 2,
    Stopped: 0,
    Unitialized: -1
});

const Player = class {
    constructor(...args){
        this.index = 0;
        this.length = args.length;
        this.songs = args;
        this.current = null;
        this.state = PlayerState.Unitialized;
    }

    async play(){
        this.current = new Audic(songs[index])
        this.current.play();
        this.state = PlayerState.Playing;

        /* (type: "timeupdate" | "ended" | "playing" | "pause" | "volumechange" | "canplay" | "canplaythrough" | "seeking" | "seeked" | "play") */
        this.current.addEventListener("ended", () => { this.current.destroy(); })
    }

    async pause(){
        if(this.current.playing){
            this.current.pause();
            this.state = PlayerState.Pause;
        }
    }

    async stop(){
        if(this.current.playing || this.state == PlayerState.Pause){
            this.current.destroy();
            this.state = PlayerState.Stopped;
        }
    }
    
    async prev(){
        
        if(this.length == 1)
            return;

        --this.index;
        if(this.index < this.length)
            this.index = 0;

        this.stop();
        this.play();
    }

    async next(){
        
        if(this.length == 1)
            return;
        
        ++this.index;
        if(this.index >= this.length)
            this.index = 0;
        
        this.stop();
        this.play();
    }
    
    async get_title(){
        return this.current.src;
    }
};

export default Player;