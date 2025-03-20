from django.shortcuts import render
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from decimal import Decimal
import requests
from datetime import datetime, timedelta, timezone
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
def get_miso_rtdata(request):

    try:
        # MISO API URL
        url = "https://api.misoenergy.org/MISORTWDBIReporter/Reporter.asmx?messageType=currentinterval&returnType=csv"
        
        response = requests.get(url)

        if response.status_code == 200:
            
            csv_content = response.text
            
            # Parse CSV data
            lines = csv_content.strip().split('\n')
            if not lines:
                return Response(
                    {"error": "Empty response from MISO API"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            headers = [h.strip() for h in lines[0].split(',')]
            
            if len(lines) > 1:
                first_row = lines[1].split(',')
                if len(first_row) >= 5:
                    interval_str = first_row[0].strip()
                    try:
                        interval_datetime = datetime.strptime(interval_str, "%Y-%m-%dT%H:%M:%S")
                        # Convert everything to UTC
                        interval_datetime = interval_datetime.replace(tzinfo=timezone.utc)
                        
                        # Calculate end interval, i.e. +5 minutes
                        interval_end_datetime = interval_datetime + timedelta(minutes=5)
                        
                        processed_nodes = []
                        
                        
                        for line_num in range(1, len(lines)):
                            try:
                                cols = [col.strip() for col in lines[line_num].split(',')]
                                if len(cols) >= 5:
                                    node = cols[1]
                                    
                                    # Parse lmp, mlc, mcc values
                                    try:
                                        lmp = Decimal(cols[2])
                                        mlc = Decimal(cols[3])
                                        mcc = Decimal(cols[4])
                                    except (ValueError, TypeError, IndexError) as e:
                                        logger.warning(f"Error parsing node data: {e}")
                                        continue
                                    
                                    
                                    node_data = {
                                        'id': line_num,
                                        'timestamp': datetime.now(timezone.utc).isoformat(),
                                        'interval_start_time': interval_datetime.isoformat(),
                                        'interval_end_time': interval_end_datetime.isoformat(),
                                        'lmp': float(lmp),
                                        'mcc': float(mcc),
                                        'mlc': float(mlc),
                                        'node': node
                                    }
                                    
                                    processed_nodes.append(node_data)
                            except Exception as e:
                                logger.error(f"Error processing CSV row {line_num}: {e}")
                                continue
                        
                        response_data = {
                            'interval_start': interval_datetime.strftime('%Y-%m-%dT%H:%M:%S'),
                            'interval_end': interval_end_datetime.strftime('%Y-%m-%dT%H:%M:%S'),
                            'node_count': len(processed_nodes),
                            'nodes': processed_nodes,
                        }
                        
                        return Response(response_data, status=status.HTTP_200_OK)
                    except ValueError as e:
                        logger.error(f"Error parsing the CSV data: {e}")
                        return Response(
                            {"error": f"Failed to parse the MISO csv data: {str(e)}"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR
                        )
                else:
                    logger.error(f"Invalid CSV format")
                    return Response(
                        {"error": "Invalid CSV format from MISO API"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            else:
                logger.error("No data received from MISO API")
                return Response(
                    {"error": "No data received from MISO API"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            logger.error(f"Failed to fetch data from MISO API. Status code: {response.status_code}")
            return Response(
                {"error": f"Failed to fetch data from MISO API. Status code: {response.status_code}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except Exception as e:
        logger.error(f"Error fetching MISO data: {e}")
        return Response(
            {"error": f"An error occurred while fetching MISO data: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
