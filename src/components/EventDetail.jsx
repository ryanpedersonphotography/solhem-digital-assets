import { useParams, Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import exifr from 'exifr'
import { Masonry } from 'masonic'
import './EventDetail.css'

const EventDetail = ({ properties }) => {
  const { propertyId, year } = useParams()
  const [activeTab, setActiveTab] = useState('all')
  const [downloading, setDownloading] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedAssets, setSelectedAssets] = useState([])
  const [selectionMode, setSelectionMode] = useState(false)
  const [sortBy, setSortBy] = useState('topPicks') // 'topPicks', 'all', or 'time'
  const [loading, setLoading] = useState(false)
  const [sortedAssets, setSortedAssets] = useState([])
  const [exifData, setExifData] = useState({})
  const [timeSort, setTimeSort] = useState('asc') // 'asc' for oldest first, 'desc' for newest first
  const [imageDimensions, setImageDimensions] = useState({})
  
  const property = properties.find(p => p.id === propertyId)
  const party = property?.events?.parties?.find(p => p.year === parseInt(year))
  
  if (!property || !party) {
    return <div className="error">Event not found</div>
  }
  
  // Create a combined list of all assets (both top and all)
  // Since top picks are separate files, we need to combine them
  const allUniqueAssets = [...new Set([...party.assets.top, ...party.assets.all])]
  const allAssetsWithMetadata = allUniqueAssets.map(asset => ({
    path: asset,
    isTopPick: party.assets.top.includes(asset)
  }))
  
  // Effect to load EXIF data and image dimensions
  useEffect(() => {
    const loadMetadata = async () => {
      setLoading(true)
      const newExifData = {}
      const newDimensions = {}
      
      // Load EXIF data and dimensions for all assets
      for (const assetObj of allAssetsWithMetadata) {
        try {
          // Load EXIF data
          const exif = await exifr.parse(`/assets/${assetObj.path}`, {
            pick: ['DateTimeOriginal', 'CreateDate', 'ModifyDate']
          })
          if (exif) {
            newExifData[assetObj.path] = exif.DateTimeOriginal || exif.CreateDate || exif.ModifyDate
          }
          
          // Load image to get dimensions
          const img = new Image()
          await new Promise((resolve) => {
            img.onload = () => {
              newDimensions[assetObj.path] = {
                width: img.width,
                height: img.height,
                aspectRatio: img.height / img.width
              }
              resolve()
            }
            img.onerror = resolve
            img.src = `/assets/${assetObj.path}`
          })
        } catch (error) {
          console.log(`Error loading metadata for ${assetObj.path}`)
        }
      }
      
      setExifData(newExifData)
      setImageDimensions(newDimensions)
      setLoading(false)
    }
    
    if (party) {
      loadMetadata()
    }
  }, [party])
  
  // Effect to sort assets based on sortBy selection
  useEffect(() => {
    let sorted = []
    
    // First, filter by view type
    switch (sortBy) {
      case 'topPicks':
        // Show only top picks (from the top array)
        sorted = allAssetsWithMetadata.filter(asset => asset.isTopPick)
        break
      case 'all':
        // Show only photos from the all directory (not top picks)
        sorted = allAssetsWithMetadata.filter(asset => asset.path.includes('/all/'))
        break
      default:
        sorted = allAssetsWithMetadata.filter(asset => asset.isTopPick)
        break
    }
    
    // Always sort by time if we have EXIF data
    if (Object.keys(exifData).length > 0) {
      sorted.sort((a, b) => {
        const timeA = exifData[a.path] ? new Date(exifData[a.path]).getTime() : 0
        const timeB = exifData[b.path] ? new Date(exifData[b.path]).getTime() : 0
        return timeSort === 'asc' ? timeA - timeB : timeB - timeA
      })
    }
    
    setSortedAssets(sorted)
  }, [sortBy, exifData, allAssetsWithMetadata.length, timeSort])
  
  const toggleAssetSelection = (asset) => {
    setSelectedAssets(prev => {
      const isSelected = prev.includes(asset)
      if (isSelected) {
        return prev.filter(a => a !== asset)
      } else {
        return [...prev, asset]
      }
    })
  }
  
  const handleAssetClick = (assetObj) => {
    const asset = typeof assetObj === 'string' ? assetObj : assetObj.path
    if (selectionMode) {
      toggleAssetSelection(asset)
    } else {
      setSelectedImage(asset)
    }
  }
  
  const clearSelection = () => {
    setSelectedAssets([])
    setSelectionMode(false)
  }
  
  const downloadSelectedAssets = async () => {
    if (selectedAssets.length === 0) return
    
    setDownloading(true)
    const zip = new JSZip()
    const folder = zip.folder(`${property.name}_${year}_Selected`)
    
    try {
      for (const asset of selectedAssets) {
        const response = await fetch(`/assets/${asset}`)
        const blob = await response.blob()
        const filename = asset.split('/').pop()
        folder.file(filename, blob)
      }
      
      const content = await zip.generateAsync({ type: 'blob' })
      saveAs(content, `${property.name}_${year}_Selected_Assets.zip`)
      clearSelection()
    } catch (error) {
      console.error('Error downloading assets:', error)
      alert('Error downloading assets. Please try again.')
    } finally {
      setDownloading(false)
    }
  }
  
  const downloadAllAssets = async () => {
    setDownloading(true)
    const zip = new JSZip()
    const propertyFolder = zip.folder(`${property.name}_${year}_Party`)
    
    try {
      // Add top picks
      if (party.assets.top.length > 0) {
        const topFolder = propertyFolder.folder('Top_Picks')
        for (const asset of party.assets.top) {
          const response = await fetch(`/assets/${asset}`)
          const blob = await response.blob()
          const filename = asset.split('/').pop()
          topFolder.file(filename, blob)
        }
      }
      
      // Add all photos
      if (party.assets.all.length > 0) {
        const allFolder = propertyFolder.folder('All_Photos')
        for (const asset of party.assets.all) {
          const response = await fetch(`/assets/${asset}`)
          const blob = await response.blob()
          const filename = asset.split('/').pop()
          allFolder.file(filename, blob)
        }
      }
      
      const content = await zip.generateAsync({ type: 'blob' })
      saveAs(content, `${property.name}_${year}_Party_Assets.zip`)
    } catch (error) {
      console.error('Error downloading assets:', error)
      alert('Error downloading assets. Please try again.')
    } finally {
      setDownloading(false)
    }
  }
  
  return (
    <div className="event-detail">
      <div className="event-header">
        <Link to="/by-year" className="back-link">← Back to Events</Link>
        <div className="event-title">
          <h1>{property.name} - {year} Party</h1>
          <p className="event-date">
            {new Date(party.date).toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          {loading && <span className="loading-indicator">Loading photo metadata...</span>}
        </div>
        <div className="download-controls">
          {selectionMode && selectedAssets.length > 0 && (
            <>
              <button 
                className="btn-download-selected"
                onClick={downloadSelectedAssets}
                disabled={downloading}
              >
                Download Selected ({selectedAssets.length})
              </button>
              <button 
                className="btn-clear"
                onClick={clearSelection}
              >
                Clear Selection
              </button>
            </>
          )}
          <button 
            className="btn-select-mode"
            onClick={() => setSelectionMode(!selectionMode)}
          >
            {selectionMode ? 'Exit Selection' : 'Select Photos'}
          </button>
          <button 
            className="btn-download-all"
            onClick={downloadAllAssets}
            disabled={downloading}
          >
            {downloading ? 'Downloading...' : 'Download All'}
          </button>
        </div>
      </div>
      
      <div className="sort-controls">
        <label className="sort-label">View:</label>
        <div className="sort-options">
          <button 
            className={`sort-btn ${sortBy === 'topPicks' ? 'active' : ''}`}
            onClick={() => setSortBy('topPicks')}
          >
            ⭐ Top Picks ({party.assets.top.length})
          </button>
          <button 
            className={`sort-btn ${sortBy === 'all' ? 'active' : ''}`}
            onClick={() => setSortBy('all')}
          >
            📷 All Photos ({party.assets.all.length})
          </button>
          <button 
            className="sort-btn time-toggle"
            onClick={() => setTimeSort(prev => prev === 'asc' ? 'desc' : 'asc')}
            disabled={loading}
            title={timeSort === 'asc' ? 'Oldest first (click for newest)' : 'Newest first (click for oldest)'}
          >
            📅 {timeSort === 'asc' ? '↑' : '↓'}
          </button>
        </div>
        <span className="photo-count">
          Showing {sortedAssets.length} photos
        </span>
      </div>
      
      {/* Future category filters - to be implemented
      <div className="category-filters">
        <label className="sort-label">Categories:</label>
        <div className="category-options">
          <button className="category-btn">
            🍔 Food/Drink
          </button>
          <button className="category-btn">
            🚚 Food Trucks
          </button>
          <button className="category-btn">
            🐕 Dogs!
          </button>
          <button className="category-btn">
            👶 Kids!
          </button>
          <button className="category-btn">
            👨‍👩‍👧‍👦 Families
          </button>
          <button className="category-btn">
            🎮 Games/Events
          </button>
          <button className="category-btn">
            👔 Solhem Staff
          </button>
          <button className="category-btn">
            🎵 Music
          </button>
        </div>
      </div>
      */}
      
      <div className="masonry-container">
        <Masonry
          items={sortedAssets}
          columnGutter={8}
          columnWidth={300}
          overscanBy={5}
          render={({ data: assetObj, width }) => {
            const asset = assetObj.path
            const captureTime = exifData[asset]
            const dimensions = imageDimensions[asset] || { aspectRatio: 1 }
            const height = width * dimensions.aspectRatio
            
            return (
              <div
                className={`masonry-item ${selectedAssets.includes(asset) ? 'selected' : ''} ${assetObj.isTopPick ? 'top-pick' : ''}`}
                onClick={() => handleAssetClick(assetObj)}
                style={{ height }}
              >
                {assetObj.isTopPick && <span className="top-pick-badge">⭐</span>}
                <img 
                  src={`/assets/${asset}`} 
                  alt={`${property.name} Photo`}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {captureTime && (
                  <div className="photo-time" title={new Date(captureTime).toLocaleString()}>
                    {new Date(captureTime).toLocaleTimeString('en-US', { 
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </div>
                )}
                {selectionMode && (
                  <div className="selection-overlay">
                    <input
                      type="checkbox"
                      checked={selectedAssets.includes(asset)}
                      onChange={(e) => {
                        e.stopPropagation()
                        toggleAssetSelection(asset)
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </div>
            )
          }}
        />
      </div>
      
      {selectedImage && !selectionMode && (
        <div className="lightbox" onClick={() => setSelectedImage(null)}>
          <div className="lightbox-content">
            <img src={`/assets/${selectedImage}`} alt="Full size" />
            <button className="lightbox-close" onClick={() => setSelectedImage(null)}>×</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default EventDetail