import Audic from 'audic';

const PlayerState = Object.freeze({
    Playing: 1,
    Paused: 2,
    Stopped: 0,
    Uninitialized: -1
});

const Player = class {
    constructor(args){
        if(args.length == 0)
            throw new Error("No song was provided in the argument list.");
        this.index = 0;
        this.length = args.length;
        this.songs = args;
        this.current = null;
        this.state = PlayerState.Uninitialized;
    }

    async play(){   
        try {
            if(this.state == PlayerState.Paused) {
                await this.current.play();
                this.state = PlayerState.Playing;
            }
            else {
                this.current = new Audic(this.songs[this.index]);
                await this.current.play();
                this.state = PlayerState.Playing;
            }
            this.current.addEventListener("ended", () => { this.current.destroy(); });
        } catch (error) {
            console.error(error);
            this.state = PlayerState.Uninitialized;
        }
    }

    async pause(){
        if(this.state == PlayerState.Paused) return;
        if(this.current.playing){
            this.current.pause();
            this.state = PlayerState.Paused;
        }
    }

    async stop(){
        if(this.state == PlayerState.Stopped) return;
        if(this.current.playing || this.state == PlayerState.Paused){
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
    
    async getPlayingSong(){
        return this.current.src;
    }
};

export default Player;
