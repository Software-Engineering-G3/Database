import Audic from 'audic';
import NodeID3 from 'node-id3';
import { glob } from "glob";
import hound from 'hound';

const PlayerState = Object.freeze({
    Playing: 1,
    Paused: 0,
    Destroyed: -1
});

export default class Player extends EventTarget {
    constructor(args, autoPlay = false)
    {
        super()
        if(args.length == 0)
            throw new Error("No song was provided in the argument list.");
        
        this.index = 0;
        this.autoPlay = autoPlay;
        this.songs = [];
        this.current = null;
        this.state = PlayerState.Uninitialized;
        this.defaultDirectory = "./music/";
        this.fileExtension = "*.mp3";
        this.autoUpdateList = true;
        this.initialize(args)
    }

    initialize(args) 
    {
        this._constructMusicList(args)
        this._monitorFolder()
        this._printModuleHeader()
        this._constructPlayer()
    }

    _printModuleHeader(){
        console.log("Music Player v 0.0.0.2")
        console.log("Found: " + this.songs.length + " songs")
        console.log("Autoplay: " + (this.autoPlay ? "Enabled" : "Disabled"))
    }

    _constructMusicList(songFiles) 
    {
        songFiles.forEach(song => {
            const tags = NodeID3.read(song)
            this.songs.push({
                title: tags.artist + " - " + tags.title,
                src: song
            })
        });
    }

    _constructPlayer()
    {
        if (this.current == null) 
        {
            this.current = new Audic(this.songs[this.index].src)
            this.current.addEventListener("pause", () => { this.dispatchEvent(new Event("paused")) })
            this.current.addEventListener("ended", () => { (this.autoPlay ? this.next() : this.current.destroy()); })
            this.current.addEventListener("volumechange", () => { this.dispatchEvent(new Event("volumechanged")) })
            this.state = PlayerState.Paused
        }
    }

    _destroyPlayer()
    {
        if(this.current != null)
        {
            if(this.state == PlayerState.Playing || this.state == PlayerState.Paused)
            {
                this.current.destroy()
                this.current = null
                this.state = PlayerState.Destroyed
            }
        }
    }

    _monitorFolder() 
    {
        var watcher = null;
        if(this.autoUpdateList) {
            watcher = hound.watch(this.defaultDirectory);
            
            watcher.on("create", (file) => 
            { 
                console.log("New song added: " + file);
                this._constructMusicList(glob.sync(this.defaultDirectory + this.fileExtension));
            })

            watcher.on('change', (file) => 
            {
                console.log("Song changed: " + file);
                this._constructMusicList(glob.sync(this.defaultDirectory + this.fileExtension));
            })

            watcher.on("delete", (file) => 
            { 
                console.log("Song deleted: " + file);
                this._constructMusicList(glob.sync(this.defaultDirectory + this.fileExtension));
            })
            
        } 
        else 
        {
            if(watcher != null) 
                watcher.clear();
        }
    }

    async updateList()
    {
        if(!this.autoUpdateList)
            this._constructMusicList(glob.sync(this.defaultDirectory + this.fileExtension))
    }

    async play()
    {
        try
        {
            if(this.state == PlayerState.Destroyed || this.state == PlayerState.Paused) 
            {
                this._constructPlayer()
                this.state = PlayerState.Playing
                await this.current.play()
            }
        } 
        catch (error) 
        {
            console.error(error);
            this.state = PlayerState.Paused;
        }
    }

    async pause()
    {
        if(this.state == PlayerState.Playing)
        {
            this.current.pause();
            this.state = PlayerState.Paused;
        }
    }
    
    async prev()
    {
        if(this.songs.length > 1)
        {
            if(this.state == PlayerState.Playing)
            {
                --this.index;
                if(this.index < 0)
                    this.index = this.songs.length - 1
    
                this.dispatchEvent(new Event("playing-prev-title"))
                this._destroyPlayer()
                this.play()
            }
            else {
                --this.index;
                if(this.index < 0)
                    this.index = this.songs.length - 1

                this.dispatchEvent(new Event("changed-song"))
                this._destroyPlayer()
            }
        }
    }

    async next()
    {
        if(this.songs.length > 1)
        {
            if(this.state == PlayerState.Playing)
            {
                ++this.index;
                if(this.index >= this.songs.length)
                this.index = 0;
            
                this.dispatchEvent(new Event("playing-next-title"))
                this._destroyPlayer()
                this.play()
            }
            else {
                ++this.index;
                if(this.index >= this.songs.length)
                this.index = 0;
                
                this.dispatchEvent(new Event("changed-song"))
                this._destroyPlayer()
            }
        }
    }

    changeAutoUpdate(autoUpdateValue)
    {
        if(!(typeof autoUpdateValue === 'boolean'))
            throw new Error('Type mismatch: expected boolean, instead got' + typeof(autoUpdateValue) + '.');
        
        this.autoUpdateList = autoUpdateValue;
    }

    changeAutoPlay(autoPlay)
    {
        if(!(typeof autoPlay === 'boolean'))
            throw new Error('Type mismatch: expected boolean, instead got' + typeof(autoPlay) + '.');
        
        this.autoPlay = autoPlay;
    }

    changeVolume(volume)
    {
        // Accepts between: 0 - 100
        this.current.volume = parseFloat(volume)/100
    }
    
    getPlayingSong()
    {
        return this.songs[this.index].title;
    }

    json() {
        const tags = NodeID3.read(this.songs[this.index].src)
        return {
            "component": "player",
            "state": Object.keys(PlayerState).find(k => PlayerState[k] === this.state),
            "autoplay": (this.autoPlay ? true : false),
            "artist": tags.artist,
            "title": tags.title,
            "volume": Math.round(this.current.volume * 100)
        }
    }
};
