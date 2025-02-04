import { useState, useContext, useEffect } from 'react'
import { Row, Col, Input, Button, Image, Divider } from 'antd'
import Media from '../../components/media'
import { MediaContext } from '../../context/media'
import axios from 'axios'
import toast from 'react-hot-toast'
import AdminLayout from '../../components/layout/AdminLayout'
import useHome from '../../hooks/useHome'

const Customize = () => {
  const [media, setMedia] = useContext(MediaContext)
  const [loading, setLoading] = useState('')
  const {
    title,
    subtitle,
    fullWidthImage,
    setTitle,
    setSubtitle,
    setFullWidthImage,
  } = useHome()

  const handleSave = async () => {
    try {
      setLoading(true)
      const { data } = await axios.post('/page', {
        page: 'home',
        title,
        subtitle,
        fullWidthImage: media?.selected?._id,
      })
      setLoading(false)
      toast.success('Page Updated Successfully')
    } catch (err) {
      console.log(err)
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <Row style={{ marginTop: 50, marginLeft: 110, marginRight: 50 }}>
        <Col span={24}>
          <Divider>
            <h1>Customize home page</h1>
            <p>Set full width image title and subtitle</p>
          </Divider>
        </Col>

        <Col span={18}>
          <Media />

          <Input
            style={{ margin: '20px 0px 20px 0px' }}
            size="large"
            placeholder="Give it a title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <Input
            size="large"
            placeholder="Give it a subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
          />

          <Button
            onClick={handleSave}
            type="default"
            style={{ margin: '10px 0px 10px 0px' }}
            loading={loading}
            block
          >
            Save
          </Button>
        </Col>

        <Col span={6}>
          <div style={{ margin: '40px 0px 0px 20px' }}>
            {media?.selected ? (
              <Image width="100%" src={media?.selected?.url} />
            ) : fullWidthImage ? (
              <Image width="100%" src={fullWidthImage.url} />
            ) : (
              ''
            )}
          </div>
        </Col>
      </Row>
    </AdminLayout>
  )
}

export default Customize
