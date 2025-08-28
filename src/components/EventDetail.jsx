import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import './EventDetail.css'

const EventDetail = ({ properties }) => {
  const { propertyId, year } = useParams()
  const [activeTab, setActiveTab] = useState('top')
  const [downloading, setDownloading] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedAssets, setSelectedAssets] = useState([])
  const [selectionMode, setSelectionMode] = useState(false)
  
  const property = properties.find(p => p.id === propertyId)
  const party = property?.events?.parties?.find(p => p.year === parseInt(year))
  
  if (!property || !party) {
    return <div className="error">Event not found</div>
  }
  
  const assets = activeTab === 'top' ? party.assets.top : party.assets.all
  
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
  
  const handleAssetClick = (asset) => {
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
      
      <div className="asset-tabs">
        <button 
          className={`tab ${activeTab === 'top' ? 'active' : ''}`}
          onClick={() => setActiveTab('top')}
        >
          Top Picks ({party.assets.top.length})
        </button>
        <button 
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Photos ({party.assets.all.length})
        </button>
      </div>
      
      <div className="assets-grid">
        {assets.map((asset, index) => (
          <div
            key={index}
            className={`asset-item ${selectedAssets.includes(asset) ? 'selected' : ''}`}
            onClick={() => handleAssetClick(asset)}
          >
            <img 
              src={`/assets/${asset}`} 
              alt={`${property.name} ${activeTab === 'top' ? 'Top Pick' : 'Photo'} ${index + 1}`}
              loading="lazy"
            />
            {selectionMode && (
              <div className="selection-overlay">
                <input
                  type="checkbox"
                  checked={selectedAssets.includes(asset)}
                  onChange={(e) => {
                    e.stopPropagation()
                    toggleAssetSelection(asset)
                  }}
                />
              </div>
            )}
          </div>
        ))}
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