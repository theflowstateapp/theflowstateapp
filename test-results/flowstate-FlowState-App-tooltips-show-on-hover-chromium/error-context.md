# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e5]: "[plugin:vite:esbuild]"
    - generic [ref=e6]: "Transform failed with 3 errors: /Users/abhishekjohn/Documents/Business/Flowstate/src/App.jsx:692:8: ERROR: Unexpected closing \"Container\" tag does not match opening \"div\" tag /Users/abhishekjohn/Documents/Business/Flowstate/src/App.jsx:693:6: ERROR: Unexpected closing \"div\" tag does not match opening \"Container\" tag /Users/abhishekjohn/Documents/Business/Flowstate/src/App.jsx:698:2: ERROR: Unexpected \"const\""
  - generic [ref=e8] [cursor=pointer]: /Users/abhishekjohn/Documents/Business/Flowstate/src/App.jsx:692:8
  - generic [ref=e9]: "Unexpected closing \"Container\" tag does not match opening \"div\" tag 690| </div> 691| </div> 692| </Container> | ^ 693| </div> 694| ); Unexpected closing \"div\" tag does not match opening \"Container\" tag 691| </div> 692| </Container> 693| </div> | ^ 694| ); 695| } Unexpected \"const\" 696| 697| function QuickCapture({ onAdd }) { 698| const [v, setV] = useState(\"\"); | ^ 699| return ( 700| <div className=\"mt-3 flex gap-2\">"
  - generic [ref=e10]:
    - text: at failureErrorWithLog (
    - generic [ref=e11] [cursor=pointer]: /Users/abhishekjohn/Documents/Business/Flowstate/node_modules/esbuild/lib/main.js:1472:15
    - text: ) at
    - generic [ref=e12] [cursor=pointer]: /Users/abhishekjohn/Documents/Business/Flowstate/node_modules/esbuild/lib/main.js:755:50
    - text: at responseCallbacks.<computed> (
    - generic [ref=e13] [cursor=pointer]: /Users/abhishekjohn/Documents/Business/Flowstate/node_modules/esbuild/lib/main.js:622:9
    - text: ) at handleIncomingPacket (
    - generic [ref=e14] [cursor=pointer]: /Users/abhishekjohn/Documents/Business/Flowstate/node_modules/esbuild/lib/main.js:677:12
    - text: ) at Socket.readFromStdout (
    - generic [ref=e15] [cursor=pointer]: /Users/abhishekjohn/Documents/Business/Flowstate/node_modules/esbuild/lib/main.js:600:7
    - text: ) at Socket.emit (node:events:507:28) at addChunk (node:internal
    - generic [ref=e16] [cursor=pointer]: /streams/readable:559:12
    - text: ) at readableAddChunkPushByteMode (node:internal
    - generic [ref=e17] [cursor=pointer]: /streams/readable:510:3
    - text: ) at Readable.push (node:internal
    - generic [ref=e18] [cursor=pointer]: /streams/readable:390:5
    - text: ) at Pipe.onStreamRead (node:internal
    - generic [ref=e19] [cursor=pointer]: /stream_base_commons:189:23
  - generic [ref=e20]:
    - text: Click outside, press
    - generic [ref=e21]: Esc
    - text: key, or fix the code to dismiss.
    - text: You can also disable this overlay by setting
    - code [ref=e22]: server.hmr.overlay
    - text: to
    - code [ref=e23]: "false"
    - text: in
    - code [ref=e24]: vite.config.js
    - text: .
```