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
        this.current = null
        this.state = PlayerState.Unitialized
    }

    async play(){
        // Create a new instance of Audic with the current song
        this.current = new Audic(songs[index])
        
        // Play the current song
        this.current.play();
        
        // Set the state of the player to Playing
        this.state = PlayerState.Playing;

        // When the current song ends, destroy the current instance of Audic
        this.current.addEventListener("ended", () => { this.current.destroy(); })
    }

    async pause(){
        // Check if the current song is playing
        if(this.current.playing){
            // Pause the current song
            this.current.pause();
            
            // Set the state of the player to Pause
            this.state = PlayerState.Pause;
        }
    }

    async stop(){
        // Check if the current song is playing or if the player is in a paused state
        if(this.current.playing || this.state == PlayerState.Pause){
            // Destroy the instance of Audic
            this.current.destroy();
            
            // Set the state of the player to Stopped
            this.state = PlayerState.Stopped;
        }
    }
    
    async prev(){
        // Check if there is only one song in the list
        if(this.length == 1)
            return;

        // Decrement the index of the current song
        --this.index;
        
        // If the index is less than 0, set it to the last song in the list
        if(this.index < this.length)
            this.index = 0;

        // Stop the current song and start playing the new song at the updated index
        this.stop();
        this.play();
    }

    async next(){
        // Check if there is only one song in the list
        if(this.length == 1)
            return;
        
        // Increment the index of the current song
        ++this.index;
        
        // If the index is greater than or equal to the length of the list, set it to 0
        if(this.index >= this.length)
            this.index = 0;
        
        // Stop the current song and start playing the new song at the updated index
        this.stop();
        this.play();
    }
    
    async get_title(){
        // This method could be used to retrieve the title of the current song
    }
};

export default Player;
