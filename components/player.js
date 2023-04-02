import Audic from 'audic';
import NodeID3 from 'node-id3';
import { glob } from "glob";
import hound from 'hound';

const PlayerState = Object.freeze({
    Playing: 1,
    Paused: 2,
    Stopped: 0,
    Uninitialized: -1
});

const Player = class {
    constructor(args, autoPlay = false)
    {
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
        this.constructMusicList(args);
        this.monitorFolder();
    }

    constructMusicList(songFiles) 
    {
        songFiles.forEach(song => {
            const tags = NodeID3.read(song)
            this.songs.push({
                title: tags.artist + " - " + tags.title,
                src: song
            })
        });
    }

    monitorFolder() 
    {
        if(this.autoUpdateList) {
            var watcher = hound.watch(this.defaultDirectory);
            
            watcher.on("create", (file) => 
            { 
                console.log("New song added: " + file);
                this.constructMusicList(glob.sync(this.defaultDirectory + this.fileExtension));
            })

            watcher.on('change', (file) => 
            {
                console.log("Song changed: " + file);
                this.constructMusicList(glob.sync(this.defaultDirectory + this.fileExtension));
            })

            watcher.on("delete", (file) => 
            { 
                console.log("Song deleted: " + file);
                this.constructMusicList(glob.sync(this.defaultDirectory + this.fileExtension));
            })
            
        } 
        else 
        {
            watcher.clear();
        }
    }

    async updateList()
    {
        if(!this.autoUpdateList)
            this.constructMusicList(glob.sync(this.defaultDirectory + this.fileExtension))
    }

    async play()
    {   
        try 
        {
            if(this.state == PlayerState.Uninitialized)
            {
                console.log("Music Player v 0.0.0.2")
                console.log("Found: " + this.songs.length + " songs")
                console.log("Autoplay: " + (this.autoPlay ? "Enabled" : "Disabled"))
            }

            if(this.state == PlayerState.Paused) 
            {
                this.state = PlayerState.Playing;
            }
            else 
            {
                this.current = new Audic(this.songs[this.index].src);
                this.state = PlayerState.Playing;
            }
            
            await this.current.play();
            console.log("Now playing: " + this.songs[this.index].title)
            
            this.current.addEventListener("ended", () => 
            { 
               (this.autoPlay ? console.log("Playing next song.") : "");  
               (this.autoPlay ? this.next() : this.current.destroy()); 
            });
        } 
        catch (error) 
        {
            console.error(error);
            this.state = PlayerState.Uninitialized;
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

    async stop()
    {
        if(this.current != null)
        {
            if(this.state == PlayerState.Playing || this.state == PlayerState.Paused)
            {
                this.current.destroy();
                this.state = PlayerState.Stopped;
            }
        }
    }
    
    async prev()
    {
        if(this.songs.length > 1)
        {
            --this.index;
            if(this.index < 0)
                this.index = 0;

            this.stop();
            this.play();
        }
    }

    async next()
    {
        if(this.songs.length > 1)
        {
            ++this.index;
            if(this.index >= this.songs.length)
                this.index = 0;
            
            this.stop();
            this.play();
        }
    }

    async changeAutoUpdate()
    {
        this.autoUpdateList = !this.autoUpdateList;
    }
    
    getPlayingSong()
    {
        return this.songs[this.index].title;
    }
};

export default Player;