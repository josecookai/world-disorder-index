#!/usr/bin/env python3
"""
Global Disorder Index (GDI) - 世界完蛋了指数
Main entry point

@author: josepumpbtc
@version: 1.1.0
"""

import asyncio
import logging
from datetime import datetime

from src.api.server import start_server
from src.processors.index_calculator import GDICalculator

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def main():
    """Main entry point"""
    logger.info("=" * 50)
    logger.info("🌍 Global Disorder Index (GDI) v1.1")
    logger.info("   世界完蛋了指数")
    logger.info("=" * 50)
    
    # Initialize calculator
    calculator = GDICalculator()
    
    # Start API server
    logger.info("Starting API server...")
    await start_server()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("\n👋 Goodbye! Stay safe out there.")
