import {
  Card,
  declareIndexPlugin,
  ReactRNPlugin,
  RemId,
  WidgetLocation,
  AppEvents
} from '@remnote/plugin-sdk';
import { HistoryData } from '../types';
import '../style.css';
import '../App.css';

async function onActivate(plugin: ReactRNPlugin) {

  await plugin.app.registerWidget(
    "cardHistory",
    WidgetLocation.RightSidebar,
    {
      dimensions: { height: "auto", width: "100%" },
      widgetTabIcon: "https://i.imgur.com/MLaBDJw.png",
    }
  );
  
  // Each time the user opens a Rem, we record this event in synced storage.
  // We can use the useSyncedStorage hook in widget components to reactively
  // get this list of history entries.
  //
  // Since we are using synced storage, the data persists between refreshes
  // and gets synced between devices.
  plugin.event.addListener( AppEvents.QueueCompleteCard,
    undefined,
    async (message) => {
      // Log the entire message object to see its structure
      console.log("QueueCompleteCard message:", message);

      //const currentRemId = message.remId as RemId;

      const cardId = message.cardId as string;
      // Fetch the card and get its remId
      const card = await plugin.card.findOne(cardId);
      const currentRemId = card?.remId as RemId;

      //
      const currentScore = card?.repetitionHistory?.[card?.repetitionHistory?.length-1]?.score;

      console.log("Current Score: " + currentScore);
    
      //const currentRemData = (await plugin.storage.getSynced("remData")) || [];
      const currentRemData: HistoryData[] = (await plugin.storage.getSynced("cardData")) || [];
  
      if (currentRemData[0]?.remId != currentRemId) {
        await plugin.storage.setSynced("cardData", [{ key: Math.random(),
                                                      remId: currentRemId,
                                                      open: false,
                                                      time: new Date().getTime(),
                                                      score : currentScore},
                                                    ...currentRemData,]);
      }
    });
}

async function onDeactivate(_: ReactRNPlugin) {}

declareIndexPlugin(onActivate, onDeactivate);
