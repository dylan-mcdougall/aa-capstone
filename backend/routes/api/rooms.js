const express = require('express');
const { requireAuth } = require('../../utils/auth');
const { Room, RoomMessage } = require('../../db/models');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const randomImageName = require('./helper');
const dotenv = require('dotenv');

dotenv.config();
const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;

const s3 = new S3Client({
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretAccessKey,
    },
    region: bucketRegion
})

const router = express.Router();

router.delete('/:id/messages/:messageId', requireAuth, async (req, res) => {
    const room = await Room.findByPk(req.params.id);
    if (!room) return res.status(404).json({
        "errors": "No room associated with this id exists."
    });
    const targetMessage = await RoomMessage.findByPk(req.params.messageId);
    if (!targetMessage) return res.status(404).json({
        "errors": "No message associated with this id exists."
    });
    if (parseInt(targetMessage.room_id) !== parseInt(req.params.id)) return res.status(400).json({
        "errors": "Specified message does not belong in specified room."
    });
    if (parseInt(targetMessage.user_id) !== req.user.id) return res.status(401).json({
        "errors": "Only the author of a message can delete it."
    });

    if (targetMessage.content_type === 'src') {
        const params = {
            Bucket: bucketName,
            Key: targetMessage.content_src_name
        }
        const command = new DeleteObjectCommand(params);
        await s3.send(command);
    }

    await targetMessage.destroy();
    return res.json({
        "message": "Message successfully deleted."
    })
})

router.patch('/:id/messages/:messageId', requireAuth, async (req, res) => {
    const room = await Room.findByPk(req.params.id);
    if (!room) return res.status(404).json({
        "errors": "No room associated with this id exists."
    });
    const targetMessage = await RoomMessage.findByPk(req.params.messageId);
    if (!targetMessage) return res.status(404).json({
        "errors": "No message associated with this id exists."
    });
    if (parseInt(targetMessage.room_id) !== parseInt(req.params.id)) return res.status(400).json({
        "errors": "Specified message does not belong in specified room."
    });
    if (parseInt(targetMessage.user_id) !== req.user.id) return res.status(401).json({
        "errors": "Only the author of a message can edit it."
    });

    const { content_message } = req.body;
    if (!content_message) return res.status(400).json({
        "errors": "Please include the updated message properly in the request body."
    });

    await targetMessage.update({ content_message: content_message });
    return res.json(targetMessage);
})

router.post('/:id/messages', requireAuth, async (req, res) => {
    const room = await Room.findByPk(req.params.id);

    if (!room) return res.status(404).json({
        "errors": "No room associated with this id exists."
    });

    const { content_type, content_message, content_src } = req.body;

    let imageName;
    if (content_type === "src") {
        imageName = randomImageName();
        const params = {
            Bucket: bucketName,
            Key: imageName,
            Body: req.file.buffer,
            ContentType: req.file.mimetype
        }

        const command = new PutObjectCommand(params)

        await s3.send(command);
    }

    const payload = await RoomMessage.create({
        room_id: req.params.id,
        user_id: req.user.id,
        content_type,
        content_message: content_message ? content_message : null,
        content_src: content_src ? content_src : null,
        content_src_name: imageName ? imageName : null
    });
    if (!payload) return res.status(500).json({
        "errors": "There was an issue creating your message, please try again."
    })

    return res.json(payload);
})

router.get('/:id', requireAuth, async (req, res) => {
    const room = await Room.findOne({
        where: {
            id: req.params.id
        },
        include: [
            { model: RoomMessage, as: 'Messages' }
        ]
    });
    if (!room) return res.status(404).json({
        "errors": "No room associated with this id exists."
    });
    for (const message of room.Messages) {
        const getObjectParams = {
            Bucket: bucketName,
            Key: message.content_src_name ? message.content_src_name : null
        }
        if (!getObjectParams.Key) {
            continue
        }
        const command = new GetObjectCommand(getObjectParams);
        const url = await getSignedUrl(s3, command, { expiresIn: 3600 })
        message.content_src = url;
    }

    return res.json(room);
})

module.exports = router;
