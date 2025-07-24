from models import HouseModel

# Get houses and check image structure
houses = HouseModel.find_all({'available': True})
print(f'Total houses: {len(houses)}')

for i, house in enumerate(houses[:3]):
    print(f'\nHouse {i+1}: {house.get("name", "Unknown")}')
    print(f'Images: {house.get("images", [])}')
    
    # Check if images exist and their structure
    images = house.get("images", [])
    if images:
        print(f'First image structure: {images[0]}')
        if isinstance(images[0], dict):
            print(f'Image keys: {list(images[0].keys())}')
    else:
        print('No images found')
