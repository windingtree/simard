from .context import Context
from .db import db
from .travel_batch import TravelBatch
from typing import List

class TravelBatchManager(object):
    @staticmethod
    def get_travel_batches(context: Context) -> List[TravelBatch]:
        """
        Get the travel-components created after the last tadc file transfer date.
        ( with it's token information ) and ( mapped by currency )
        """
        timestamp_min = context.previous_cutoff_datetime.timestamp()
        # timestamp_min = datetime.now(timezone_picker("Europe/Tallinn")) - timedelta(hours=10)
        # timestamp_min = 1697478517

        timestamp_max = context.current_cutoff_datetime.timestamp()

        result = db.tokens.aggregate([
            {
                "$match": {
                    "isAmexTravelAccountToken": True,
                    "travelComponents": {
                        "$elemMatch": {
                    "createdAt": {
                        "$gte": timestamp_min,
                        "$lte": timestamp_max
                            }
                        }
                    }
                }
            },
            {
                "$project": {
                    "uuid": "$uuid",
                    "currency": "$currency",
                    "amount": "$amount",
                    "cardData": "$cardData",
                    "customerReferences": "$customerReferences",
                    "travelComponents": {
                        "$filter": {
                            "input": "$travelComponents",
                            "as": "travelComponent",
                            "cond": {
                                "$gte": ["$$travelComponent.createdAt", timestamp_min],
                                "$lte": ["$$travelComponent.createdAt", timestamp_max],
                            }
                        }
                    }
                }
            },
            {
                "$group": {
                    "_id": "$currency",
                    "tokens": {
                        "$push": {
                            "uuid": "$uuid",
                            "amount": "$amount",
                            "currency": "$currency",
                            "cardData": "$cardData",
                            "customerReferences": "$customerReferences",
                            "travelComponents": "$travelComponents",
                            "createdAt": "$createdAt"
                        }
                    }
                }
            }
        ])

        return TravelBatch.from_aggregate_list(
            travel_batch_sequence_cursor=context.travel_batch_sequence_number,
            travel_transaction_sequence_cursor=context.travel_transaction_sequence_number,
            mongo_list=list(result)
        )
