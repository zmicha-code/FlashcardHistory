import React, { useEffect } from "react";
import {
  RemHierarchyEditorTree,
  RemId,
  RemViewer,
  renderWidget,
  usePlugin,
  useSyncedStorageState,
  QueueInteractionScore,
} from "@remnote/plugin-sdk";
import { HistoryData, timeSince } from '../types';

const NUM_TO_LOAD_IN_BATCH = 20;

function cardHistorySidebar() {
  const [remData, setRemData] = useSyncedStorageState<HistoryData[]>(
    "cardData",
    []
  );

  // Remove from History
  const closeIndex = (index: number) => { 
    // This code directly modifies remData (mutates it), which isn’t ideal in React because state should be immutable.
    //remData.splice(index, 1);
    //setRemData(remData);
    const newData = [...remData]; // Create a copy
    newData.splice(index, 1);
    setRemData(newData);
  };

  // Partial is a TypeScript utility type, not a class. It makes all properties of HistoryData optional. So, changes can include just some properties of HistoryData (e.g., { open: true }) without needing to provide everything.
  // Creates a new object by merging oldData with changes using the spread operator. For example, if changes = { open: true }, it updates open while keeping other properties intact.
  // Replaces the old object at index with newData
  // Change name from setData to updateData
  const updateData = (index: number, changes: Partial<HistoryData>) => { 
    //const oldData = remData[index];
    //const newData = { ...oldData, ...changes }; 
    //remData.splice(index, 1, newData); 
    //setRemData(remData);
    const newDataArray = [...remData];
    newDataArray[index] = { ...remData[index], ...changes };
    setRemData(newDataArray);
  };

  // Think of it as a variable (numLoaded) and its setter (setNumLoaded).
  // Initial value 1
  const [numLoaded, setNumLoaded] = React.useState(1);

  // It’s a hook for handling side effects (e.g., things that happen after rendering, like resetting values).
  // This useEffect runs whenever remData.length changes (due to the dependency array [remData.length]). When it runs, it calls setNumLoaded(1), resetting numLoaded to 1.
  // Why? If the history data changes (e.g., items are added or removed), it restarts the display from the first batch.
  useEffect(() => {
    setNumLoaded(1);
  }, [remData.length]);

  const numUnloaded = Math.max(0, remData.length - NUM_TO_LOAD_IN_BATCH * numLoaded);

  // Rendering Logic
  return (
    <div
      className="h-full w-full overflow-y-auto rn-clr-background-primary"
      //This stops the mouseDown event from “bubbling up” to parent elements. For example, clicking in the sidebar won’t trigger actions in the main app, keeping interactions isolated.
      onMouseDown={(e) => e.stopPropagation()} // What does this do?
    >
        {/* This is conditional rendering in JSX. */}
      {remData.length == 0 && (
        <div className="rn-clr-content-primary">
          Do more flashcards.
        </div>
      )}
      {/*Slice a fraction of the history to be displayed. map((data, i) => ...) loops over those items, rendering a <RemHistoryItem> for each one. data is the item, i is its index in the sliced array.*/}
      {remData.slice(0, NUM_TO_LOAD_IN_BATCH * numLoaded).map((data, i) => (
        <RemHistoryItem
          data={data}
          remId={data.remId}
          key={data.key || Math.random()}
          setData={(c) => updateData(i, c)}
          closeIndex={() => closeIndex(i)}
        />
      ))}
      {numUnloaded > 0 && (
        <div
          onMouseOver={() => setNumLoaded((i) => i + 1)}
          className="pb-[200px]"
        >
          {" "}
          Load more{" "}
          <span className="rn-clr-content-secondary">({numUnloaded})</span>
        </div>
      )}
    </div>
  );
}

// One Entry in the History List
interface RemHistoryItemProps {
  data: HistoryData;
  remId: string;
  setData: (changes: Partial<HistoryData>) => void;
  closeIndex: () => void;
}

function RemHistoryItem({
  data,
  remId,
  setData,
  closeIndex,
}: RemHistoryItemProps) {
  const plugin = usePlugin();

  const scoreToImage = new Map<QueueInteractionScore, string>([
    [QueueInteractionScore.TOO_EARLY, "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzNiAzNiI+PHBhdGggZmlsbD0iI0ZGQ0M0RCIgZD0iTTIwIDYuMDQyYzAgMS4xMTItLjkwMyAyLjAxNC0yIDIuMDE0cy0yLS45MDItMi0yLjAxNFYyLjAxNEMxNiAuOTAxIDE2LjkwMyAwIDE4IDBzMiAuOTAxIDIgMi4wMTR2NC4wMjh6Ii8+PHBhdGggZmlsbD0iI0ZGQUMzMyIgZD0iTTkuMTggMzZjLS4yMjQgMC0uNDUyLS4wNTItLjY2Ni0uMTU5YTEuNTIxIDEuNTIxIDAgMCAxLS42NjctMi4wMjdsOC45NC0xOC4xMjdjLjI1Mi0uNTEyLjc2OC0uODM1IDEuMzMzLS44MzVzMS4wODEuMzIzIDEuMzMzLjgzNWw4Ljk0MSAxOC4xMjdhMS41MiAxLjUyIDAgMCAxLS42NjYgMi4wMjcgMS40ODIgMS40ODIgMCAwIDEtMS45OTktLjY3NkwxOC4xMjEgMTkuNzRsLTcuNjA3IDE1LjQyNUExLjQ5IDEuNDkgMCAwIDEgOS4xOCAzNnoiLz48cGF0aCBmaWxsPSIjNTg1OTVCIiBkPSJNMTguMTIxIDIwLjM5MmEuOTg1Ljk4NSAwIDAgMS0uNzAyLS4yOTVMMy41MTIgNS45OThjLS4zODgtLjM5NC0uMzg4LTEuMDMxIDAtMS40MjRzMS4wMTctLjM5MyAxLjQwNCAwTDE4LjEyMSAxNy45NiAzMS4zMjQgNC41NzNhLjk4NS45ODUgMCAwIDEgMS40MDUgMCAxLjAxNyAxLjAxNyAwIDAgMSAwIDEuNDI0bC0xMy45MDUgMTQuMWEuOTkyLjk5MiAwIDAgMS0uNzAzLjI5NXoiLz48cGF0aCBmaWxsPSIjREQyRTQ0IiBkPSJNMzQuMDE1IDE5LjM4NWMwIDguODk4LTcuMTE1IDE2LjExMS0xNS44OTQgMTYuMTExLTguNzc3IDAtMTUuODkzLTcuMjEzLTE1Ljg5My0xNi4xMTEgMC04LjkgNy4xMTYtMTYuMTEzIDE1Ljg5My0xNi4xMTMgOC43NzgtLjAwMSAxNS44OTQgNy4yMTMgMTUuODk0IDE2LjExM3oiLz48cGF0aCBmaWxsPSIjRTZFN0U4IiBkPSJNMzAuMDQxIDE5LjM4NWMwIDYuNjc0LTUuMzM1IDEyLjA4NC0xMS45MiAxMi4wODQtNi41ODMgMC0xMS45MTktNS40MS0xMS45MTktMTIuMDg0QzYuMjAyIDEyLjcxIDExLjUzOCA3LjMgMTguMTIxIDcuM2M2LjU4NS0uMDAxIDExLjkyIDUuNDEgMTEuOTIgMTIuMDg1eiIvPjxwYXRoIGZpbGw9IiNGRkNDNEQiIGQ9Ik0zMC4wNCAxLjI1N2E1Ljg5OSA1Ljg5OSAwIDAgMC00LjIxNCAxLjc3bDguNDI5IDguNTQ0QTYuMDY0IDYuMDY0IDAgMCAwIDM2IDcuMjk5YzAtMy4zMzYtMi42NjktNi4wNDItNS45Ni02LjA0MnptLTI0LjA4IDBhNS45IDUuOSAwIDAgMSA0LjIxNCAxLjc3bC04LjQyOSA4LjU0NEE2LjA2NCA2LjA2NCAwIDAgMSAwIDcuMjk5YzAtMy4zMzYgMi42NjgtNi4wNDIgNS45Ni02LjA0MnoiLz48cGF0aCBmaWxsPSIjNDE0MDQyIiBkPSJNMjMgMjBoLTVhMSAxIDAgMCAxLTEtMXYtOWExIDEgMCAwIDEgMiAwdjhoNGExIDEgMCAxIDEgMCAyeiIvPjwvc3ZnPg=="],
    [QueueInteractionScore.AGAIN, "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzNiAzNiI+PHBhdGggZmlsbD0iI0REMkU0NCIgZD0iTTIxLjUzMyAxOC4wMDIgMzMuNzY4IDUuNzY4YTIuNSAyLjUgMCAwIDAtMy41MzUtMy41MzVMMTcuOTk4IDE0LjQ2NyA1Ljc2NCAyLjIzM2EyLjQ5OCAyLjQ5OCAwIDAgMC0zLjUzNSAwIDIuNDk4IDIuNDk4IDAgMCAwIDAgMy41MzVsMTIuMjM0IDEyLjIzNEwyLjIwMSAzMC4yNjVhMi40OTggMi40OTggMCAwIDAgMS43NjggNC4yNjdjLjY0IDAgMS4yOC0uMjQ0IDEuNzY4LS43MzJsMTIuMjYyLTEyLjI2MyAxMi4yMzQgMTIuMjM0YTIuNDkzIDIuNDkzIDAgMCAwIDEuNzY4LjczMiAyLjUgMi41IDAgMCAwIDEuNzY4LTQuMjY3TDIxLjUzMyAxOC4wMDJ6Ii8+PC9zdmc+"],
    [QueueInteractionScore.HARD, "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzNiAzNiI+PHBhdGggZmlsbD0iI0ZGQ0M0RCIgZD0iTTM2IDE4YzAgOS45NDEtOC4wNTkgMTgtMTggMTgtOS45NCAwLTE4LTguMDU5LTE4LTE4QzAgOC4wNiA4LjA2IDAgMTggMGM5Ljk0MSAwIDE4IDguMDYgMTggMTgiLz48ZWxsaXBzZSBmaWxsPSIjNjY0NTAwIiBjeD0iMTIiIGN5PSIxMy41IiByeD0iMi41IiByeT0iMy41Ii8+PGVsbGlwc2UgZmlsbD0iIzY2NDUwMCIgY3g9IjI0IiBjeT0iMTMuNSIgcng9IjIuNSIgcnk9IjMuNSIvPjxwYXRoIGZpbGw9IiNGRkYiIGQ9Ik0yNSAyMWE0IDQgMCAwIDEgMCA4SDExYTQgNCAwIDAgMSAwLThoMTR6Ii8+PHBhdGggZmlsbD0iIzY2NDUwMCIgZD0iTTI1IDIwSDExYy0yLjc1NyAwLTUgMi4yNDMtNSA1czIuMjQzIDUgNSA1aDE0YzIuNzU3IDAgNS0yLjI0MyA1LTVzLTIuMjQzLTUtNS01em0wIDJhMi45OTcgMi45OTcgMCAwIDEgMi45NDkgMi41SDI0LjVWMjJoLjV6bS0xLjUgMHYyLjVoLTNWMjJoM3ptLTQgMHYyLjVoLTNWMjJoM3ptLTQgMHYyLjVoLTNWMjJoM3pNMTEgMjJoLjV2Mi41SDguMDUxQTIuOTk3IDIuOTk3IDAgMCAxIDExIDIyem0wIDZhMi45OTcgMi45OTcgMCAwIDEtMi45NDktMi41SDExLjVWMjhIMTF6bTEuNSAwdi0yLjVoM1YyOGgtM3ptNCAwdi0yLjVoM1YyOGgtM3ptNCAwdi0yLjVoM1YyOGgtM3ptNC41IDBoLS41di0yLjVoMy40NDlBMi45OTcgMi45OTcgMCAwIDEgMjUgMjh6Ii8+PC9zdmc+"],
    [QueueInteractionScore.GOOD, "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzNiAzNiI+PHBhdGggZmlsbD0iI0ZGQ0M0RCIgZD0iTTM2IDE4YzAgOS45NDEtOC4wNTkgMTgtMTggMTgtOS45NCAwLTE4LTguMDU5LTE4LTE4QzAgOC4wNiA4LjA2IDAgMTggMGM5Ljk0MSAwIDE4IDguMDYgMTggMTgiLz48cGF0aCBmaWxsPSIjNjY0NTAwIiBkPSJNMjguNDU3IDE3Ljc5N2MtLjA2LS4xMzUtMS40OTktMy4yOTctNC40NTctMy4yOTctMi45NTcgMC00LjM5NyAzLjE2Mi00LjQ1NyAzLjI5N2EuNTAzLjUwMyAwIDAgMCAuNzU1LjYwNWMuMDEyLS4wMDkgMS4yNjItLjkwMiAzLjcwMi0uOTAyIDIuNDI2IDAgMy42NzQuODgxIDMuNzAyLjkwMWEuNDk4LjQ5OCAwIDAgMCAuNzU1LS42MDR6bS0xMiAwYy0uMDYtLjEzNS0xLjQ5OS0zLjI5Ny00LjQ1Ny0zLjI5Ny0yLjk1NyAwLTQuMzk3IDMuMTYyLTQuNDU3IDMuMjk3YS40OTkuNDk5IDAgMCAwIC43NTQuNjA1QzguMzEgMTguMzkzIDkuNTU5IDE3LjUgMTIgMTcuNWMyLjQyNiAwIDMuNjc0Ljg4MSAzLjcwMi45MDFhLjQ5OC40OTggMCAwIDAgLjc1NS0uNjA0ek0xOCAyMmMtMy42MjMgMC02LjAyNy0uNDIyLTktMS0uNjc5LS4xMzEtMiAwLTIgMiAwIDQgNC41OTUgOSAxMSA5IDYuNDA0IDAgMTEtNSAxMS05IDAtMi0xLjMyMS0yLjEzMi0yLTItMi45NzMuNTc4LTUuMzc3IDEtOSAxeiIvPjxwYXRoIGZpbGw9IiNGRkYiIGQ9Ik05IDIzczMgMSA5IDEgOS0xIDktMS0yIDQtOSA0LTktNC05LTR6Ii8+PC9zdmc+"],
    [QueueInteractionScore.EASY, "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzNiAzNiI+PHBhdGggZmlsbD0iI0Y0OTAwQyIgZD0iTTE0LjE3NCAxNy4wNzUgNi43NSA3LjU5NGwtMy43MjIgOS40ODF6Ii8+PHBhdGggZmlsbD0iI0Y0OTAwQyIgZD0ibTE3LjkzOCA1LjUzNC02LjU2MyAxMi4zODlIMjQuNXoiLz48cGF0aCBmaWxsPSIjRjQ5MDBDIiBkPSJtMjEuODI2IDE3LjA3NSA3LjQyNC05LjQ4MSAzLjcyMiA5LjQ4MXoiLz48cGF0aCBmaWxsPSIjRkZDQzREIiBkPSJNMjguNjY5IDE1LjE5IDIzLjg4NyAzLjUyM2wtNS44OCAxMS42NjgtLjAwNy4wMDMtLjAwNy0uMDA0LTUuODgtMTEuNjY4TDcuMzMxIDE1LjE5QzQuMTk3IDEwLjgzMyAxLjI4IDguMDQyIDEuMjggOC4wNDJTMyAyMC43NSAzIDMzaDMwYzAtMTIuMjUgMS43Mi0yNC45NTggMS43Mi0yNC45NThzLTIuOTE3IDIuNzkxLTYuMDUxIDcuMTQ4eiIvPjxjaXJjbGUgZmlsbD0iIzVDOTEzQiIgY3g9IjE3Ljk1NyIgY3k9IjIyIiByPSIzLjY4OCIvPjxjaXJjbGUgZmlsbD0iIzk4MUNFQiIgY3g9IjI2LjQ2MyIgY3k9IjIyIiByPSIyLjQxMiIvPjxjaXJjbGUgZmlsbD0iI0REMkU0NCIgY3g9IjMyLjg1MiIgY3k9IjIyIiByPSIxLjk4NiIvPjxjaXJjbGUgZmlsbD0iIzk4MUNFQiIgY3g9IjkuNDUiIGN5PSIyMiIgcj0iMi40MTIiLz48Y2lyY2xlIGZpbGw9IiNERDJFNDQiIGN4PSIzLjA2MSIgY3k9IjIyIiByPSIxLjk4NiIvPjxwYXRoIGZpbGw9IiNGRkFDMzMiIGQ9Ik0zMyAzNEgzYTEgMSAwIDEgMSAwLTJoMzBhMSAxIDAgMSAxIDAgMnptMC0zLjQ4NkgzYTEgMSAwIDEgMSAwLTJoMzBhMSAxIDAgMSAxIDAgMnoiLz48Y2lyY2xlIGZpbGw9IiNGRkNDNEQiIGN4PSIxLjQ0NyIgY3k9IjguMDQyIiByPSIxLjQwNyIvPjxjaXJjbGUgZmlsbD0iI0Y0OTAwQyIgY3g9IjYuNzUiIGN5PSI3LjU5NCIgcj0iMS4xOTIiLz48Y2lyY2xlIGZpbGw9IiNGRkNDNEQiIGN4PSIxMi4xMTMiIGN5PSIzLjUyMyIgcj0iMS43ODQiLz48Y2lyY2xlIGZpbGw9IiNGRkNDNEQiIGN4PSIzNC41NTMiIGN5PSI4LjA0MiIgcj0iMS40MDciLz48Y2lyY2xlIGZpbGw9IiNGNDkwMEMiIGN4PSIyOS4yNSIgY3k9IjcuNTk0IiByPSIxLjE5MiIvPjxjaXJjbGUgZmlsbD0iI0ZGQ0M0RCIgY3g9IjIzLjg4NyIgY3k9IjMuNTIzIiByPSIxLjc4NCIvPjxjaXJjbGUgZmlsbD0iI0Y0OTAwQyIgY3g9IjE3LjkzOCIgY3k9IjUuNTM0IiByPSIxLjc4NCIvPjwvc3ZnPg=="]
  ]);

  const scoreImage = scoreToImage.get(data.score);

  const openRem = async (remId: RemId) => {
    const rem = await plugin.rem.findOne(remId);
    if (rem) {
      plugin.window.openRem(rem);
    }
  };

  return (
    <div className="px-1 py-4 w-full" key={remId}>
      <div className="flex gap-2 mb-2 w-full"> 
        {/* Score */}
        <div
          className="flex items-center justify-center flex-shrink-0 w-6 h-6 rounded-md cursor-pointer hover:rn-clr-background--hovered"
        >
          <img
            src={scoreImage}
          />
        </div>
        {/* Chevron */}
        <div
          className="flex items-center justify-center flex-shrink-0 w-6 h-6 rounded-md cursor-pointer hover:rn-clr-background--hovered"
          onClick={() => setData({ open: !data.open })} // data.open = !data.open
        >
          <img
            src={`${plugin.rootURL}chevron_down.svg`}
            style={{
              transform: `rotate(${data.open ? 0 : -90}deg)`,
              transitionProperty: "transform",
              transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
              transitionDuration: "150ms",
            }}
          />
        </div>
        {/* RemViewer */}
        <div className="flex-grow min-w-0 w-full" onClick={() => openRem(remId)}>
          <RemViewer
            remId={remId}
            //constraintRef="parent"// ERROR: No overload matches this call.Overload 1 of 2, '(props: RemViewerProps | Readonly<RemViewerProps>): RemViewer', gave the following error.Type '{ remId: string; constraintRef: string; maxWidth: string; className: string; }' is not assignable to type 'IntrinsicAttributes & IntrinsicClassAttributes<RemViewer> & Readonly<RemViewerProps> & Readonly<...>'.Property 'constraintRef' does not exist on type 'IntrinsicAttributes & IntrinsicClassAttributes<RemViewer> & Readonly<RemViewerProps> & Readonly<...>'.Overload 2 of 2, '(props: RemViewerProps, context: any): RemViewer', gave the following error.Type '{ remId: string; constraintRef: string; maxWidth: string; className: string; }' is not assignable to type 'IntrinsicAttributes & IntrinsicClassAttributes<RemViewer> & Readonly<RemViewerProps> & Readonly<...>'.Property 'constraintRef' does not exist on type 'IntrinsicAttributes & IntrinsicClassAttributes<RemViewer> & Readonly<RemViewerProps> & Readonly<...>'
            maxWidth="100%"
            width="100%"
            className="w-full font-semibold cursor-pointer line-clamp-2"
          />
          <div className="text-xs rn-clr-content-tertiary">
            {timeSince(new Date(data.time))}
          </div>
        </div>
        {/* Delete */}
        <div 
          className="flex items-center justify-center flex-shrink-0 w-6 h-6 rounded-md cursor-pointer hover:rn-clr-background--hovered"
          onClick={closeIndex}
        >
          <img
            src={`${plugin.rootURL}close.svg`}
            style={{
              display: "inline-block",
              fill: "var(--rn-clr-content-tertiary)",
              color: "color",
              width: 16,
              height: 16,
            }}
          />
        </div>
      </div>
      {data.open && (
        <div className="m-2" style={{ borderBottomWidth: 1 }}>
          <RemHierarchyEditorTree  width="100%" remId={remId} />
        </div>
      )}
    </div>
  );
}

renderWidget(cardHistorySidebar);
